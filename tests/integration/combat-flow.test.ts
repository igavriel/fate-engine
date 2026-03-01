import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getEnemies } from "@/app/api/game/enemies/route";
import { POST as startEncounter } from "@/app/api/game/encounter/start/route";
import { GET as getCombat } from "@/app/api/game/combat/route";
import { POST as postAction } from "@/app/api/game/action/route";
import { GET as getSummary } from "@/app/api/game/summary/route";
import { POST as postSummaryAck } from "@/app/api/game/summary/ack/route";
import { prismaTest } from "@/server/db/prismaTest";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import {
  combatStateResponseSchema,
  summaryResponseSchema,
  summaryAckResponseSchema,
} from "@/shared/zod/game";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

function authHeaders(cookie: string) {
  return { "Content-Type": "application/json", Cookie: cookie };
}

describe("combat flow: encounter start, actions, summary, ack", () => {
  let authCookie: string;
  let userId: string;
  const slotIndex = 1;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `combat-flow-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prismaTest.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    userId = user.id;
    authCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
  });

  it("full flow: create character, GET enemies, start encounter, ATTACK until WIN or RETREAT, GET summary, POST summary/ack", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "CombatHero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(enemiesRes.status).toBe(200);
    const enemiesData = (await enemiesRes.json()) as { enemies: { choiceId: string }[] };
    const choiceId = enemiesData.enemies[0]!.choiceId;

    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, choiceId }),
      })
    );
    expect(startRes.status).toBe(200);
    const startData = (await startRes.json()) as { encounterId: string };
    expect(startData.encounterId).toBeDefined();

    const combatRes = await getCombat(
      new Request(`http://localhost/api/game/combat?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(combatRes.status).toBe(200);
    const combatData = await combatRes.json();
    const combatParsed = combatStateResponseSchema.safeParse(combatData);
    expect(combatParsed.success).toBe(true);

    let outcome: string = "CONTINUE";
    let steps = 0;
    const maxSteps = 50;
    while (outcome === "CONTINUE" && steps < maxSteps) {
      const actionRes = await postAction(
        new Request("http://localhost/api/game/action", {
          method: "POST",
          headers: authHeaders(authCookie),
          body: JSON.stringify({ slotIndex, type: "ATTACK" }),
        })
      );
      expect(actionRes.status).toBe(200);
      const actionData = (await actionRes.json()) as { outcome: string };
      outcome = actionData.outcome;
      steps++;
    }
    expect(["WIN", "RETREAT", "DEFEAT"]).toContain(outcome);

    const summaryRes = await getSummary(
      new Request(`http://localhost/api/game/summary?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(summaryRes.status).toBe(200);
    const summaryData = await summaryRes.json();
    const summaryParsed = summaryResponseSchema.safeParse(summaryData);
    expect(summaryParsed.success).toBe(true);
    if (summaryParsed.success) {
      expect(summaryParsed.data.outcome).toBe(outcome);
      expect(summaryParsed.data.enemy).toBeDefined();
      expect(summaryParsed.data.delta).toBeDefined();
      expect(Array.isArray(summaryParsed.data.loot)).toBe(true);
    }

    const ackRes = await postSummaryAck(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex }),
      })
    );
    expect(ackRes.status).toBe(200);
    const ackData = await ackRes.json();
    const ackParsed = summaryAckResponseSchema.safeParse(ackData);
    expect(ackParsed.success).toBe(true);
    if (ackParsed.success) {
      expect(ackParsed.data.status).toBeDefined();
      expect(ackParsed.data.inventory).toBeDefined();
    }

    const slot = await prismaTest.saveSlot.findUnique({
      where: { userId_slotIndex: { userId, slotIndex } },
      include: { run: { include: { character: { include: { characterStats: true } } } } },
    });
    if (slot?.run?.character?.characterStats) {
      const stats = slot.run.character.characterStats;
      expect(stats.totalFights).toBeGreaterThanOrEqual(1);
      if (outcome === "WIN") {
        expect(stats.wins).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
