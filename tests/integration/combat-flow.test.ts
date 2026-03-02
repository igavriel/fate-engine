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
import { getRunState } from "@/server/game/runState";

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
    if (slot?.run) {
      const state = getRunState(slot.run.stateJson);
      expect(state.log.length).toBeLessThanOrEqual(50);
    }
  });

  it("start encounter then start again => 409 ENCOUNTER_ACTIVE", async () => {
    if (!hasRealDb) return;
    const slot = 2;
    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, name: "GuardTest", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);
    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slot}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(enemiesRes.status).toBe(200);
    const enemiesData = (await enemiesRes.json()) as { enemies: { choiceId: string }[] };
    const choiceId = enemiesData.enemies[0]!.choiceId;
    const firstStart = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, choiceId }),
      })
    );
    expect(firstStart.status).toBe(200);
    const secondStart = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, choiceId }),
      })
    );
    expect(secondStart.status).toBe(409);
    const body = (await secondStart.json()) as { error: { code: string; message: string } };
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("ENCOUNTER_ACTIVE");
    expect(body.error.message).toBeDefined();
  });

  it("stale choiceId after one completed encounter => 400 INVALID_CHOICE", async () => {
    if (!hasRealDb) return;
    const slot = 2;
    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, name: "StaleChoiceTest", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slot}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(enemiesRes.status).toBe(200);
    const enemiesData = (await enemiesRes.json()) as { enemies: { choiceId: string }[] };
    const oldChoiceId = enemiesData.enemies[0]!.choiceId;

    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, choiceId: oldChoiceId }),
      })
    );
    expect(startRes.status).toBe(200);

    let outcome: string = "CONTINUE";
    let steps = 0;
    const maxSteps = 50;
    while (outcome === "CONTINUE" && steps < maxSteps) {
      const actionRes = await postAction(
        new Request("http://localhost/api/game/action", {
          method: "POST",
          headers: authHeaders(authCookie),
          body: JSON.stringify({ slotIndex: slot, type: "ATTACK" }),
        })
      );
      expect(actionRes.status).toBe(200);
      const actionData = (await actionRes.json()) as { outcome: string };
      outcome = actionData.outcome;
      steps++;
    }
    expect(["WIN", "RETREAT", "DEFEAT"]).toContain(outcome);

    const ackRes = await postSummaryAck(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot }),
      })
    );
    expect(ackRes.status).toBe(200);

    const retryStart = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, choiceId: oldChoiceId }),
      })
    );
    expect(retryStart.status).toBe(400);
    const retryBody = (await retryStart.json()) as {
      error: { code: string; message: string };
    };
    expect(retryBody.error).toBeDefined();
    expect(retryBody.error.code).toBe("INVALID_CHOICE");
    expect(retryBody.error.message).toBeDefined();
  });

  it("no active encounter then action => 404 NO_ACTIVE_ENCOUNTER", async () => {
    if (!hasRealDb) return;
    const slot = 3;
    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({
          slotIndex: slot,
          name: "NoEncounterTest",
          species: "HUMAN",
        }),
      })
    );
    expect(createRes.status).toBe(200);
    const actionRes = await postAction(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, type: "ATTACK" }),
      })
    );
    expect(actionRes.status).toBe(404);
    const body = (await actionRes.json()) as { error: { code: string; message: string } };
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("NO_ACTIVE_ENCOUNTER");
    expect(body.error.message).toBeDefined();
  });

  it("produce outcome then call action => 409 SUMMARY_PENDING", async () => {
    if (!hasRealDb) return;
    const slot = 3;
    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slot}`, {
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
        body: JSON.stringify({ slotIndex: slot, choiceId }),
      })
    );
    expect(startRes.status).toBe(200);
    let outcome: string = "CONTINUE";
    let steps = 0;
    const maxSteps = 50;
    while (outcome === "CONTINUE" && steps < maxSteps) {
      const actionRes = await postAction(
        new Request("http://localhost/api/game/action", {
          method: "POST",
          headers: authHeaders(authCookie),
          body: JSON.stringify({ slotIndex: slot, type: "ATTACK" }),
        })
      );
      expect(actionRes.status).toBe(200);
      const actionData = (await actionRes.json()) as { outcome: string };
      outcome = actionData.outcome;
      steps++;
    }
    expect(["WIN", "RETREAT", "DEFEAT"]).toContain(outcome);
    const summaryGet = await getSummary(
      new Request(`http://localhost/api/game/summary?slotIndex=${slot}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(summaryGet.status).toBe(200);
    const actionWhilePending = await postAction(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex: slot, type: "ATTACK" }),
      })
    );
    expect(actionWhilePending.status).toBe(409);
    const body = (await actionWhilePending.json()) as { error: { code: string; message: string } };
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("SUMMARY_PENDING");
    expect(body.error.message).toBeDefined();
  });

  describe("applyAction HEAL atomicity", () => {
    let healTestUserId: string;
    let healTestAuthCookie: string;
    const healTestSlotIndex = 1;

    beforeAll(async () => {
      if (!hasRealDb) return;
      const email = `heal-atomic-${Date.now()}@test.local`;
      const passwordHash = await hashPassword("password123");
      const user = await prismaTest.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      });
      healTestUserId = user.id;
      healTestAuthCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
    });

    it("HEAL in one request updates run.hp and potion quantity atomically", async () => {
      if (!hasRealDb) return;

      await getSlots(
        new Request("http://localhost/api/game/slots", { headers: { Cookie: healTestAuthCookie } })
      );
      const createRes = await createCharacter(
        new Request("http://localhost/api/game/character/create", {
          method: "POST",
          headers: authHeaders(healTestAuthCookie),
          body: JSON.stringify({
            slotIndex: healTestSlotIndex,
            name: "HealTestHero",
            species: "HUMAN",
          }),
        })
      );
      expect(createRes.status).toBe(200);

      const enemiesRes = await getEnemies(
        new Request(`http://localhost/api/game/enemies?slotIndex=${healTestSlotIndex}`, {
          headers: { Cookie: healTestAuthCookie },
        })
      );
      expect(enemiesRes.status).toBe(200);
      const enemiesData = (await enemiesRes.json()) as { enemies: { choiceId: string }[] };
      const choiceId = enemiesData.enemies[0]!.choiceId;

      const startRes = await startEncounter(
        new Request("http://localhost/api/game/encounter/start", {
          method: "POST",
          headers: authHeaders(healTestAuthCookie),
          body: JSON.stringify({ slotIndex: healTestSlotIndex, choiceId }),
        })
      );
      expect(startRes.status).toBe(200);

      const slotBefore = await prismaTest.saveSlot.findUnique({
        where: { userId_slotIndex: { userId: healTestUserId, slotIndex: healTestSlotIndex } },
        include: {
          run: {
            include: {
              character: true,
              runInventoryItems: { include: { itemCatalog: true } },
            },
          },
        },
      });
      expect(slotBefore?.run).toBeDefined();
      const runBefore = slotBefore!.run!;
      const hpBefore = runBefore.hp;
      const hpMax = runBefore.character.baseHpMax;
      const potionRowsBefore = runBefore.runInventoryItems.filter(
        (r) => r.itemCatalog.itemType === "POTION"
      );
      const potionQtyBefore = potionRowsBefore.reduce((sum, r) => sum + r.quantity, 0);
      expect(potionQtyBefore).toBeGreaterThanOrEqual(1);

      const actionRes = await postAction(
        new Request("http://localhost/api/game/action", {
          method: "POST",
          headers: authHeaders(healTestAuthCookie),
          body: JSON.stringify({ slotIndex: healTestSlotIndex, type: "HEAL" }),
        })
      );
      expect(actionRes.status).toBe(200);
      const actionData = (await actionRes.json()) as { outcome: string };
      expect(actionData.outcome).toBe("CONTINUE");

      const slotAfter = await prismaTest.saveSlot.findUnique({
        where: { userId_slotIndex: { userId: healTestUserId, slotIndex: healTestSlotIndex } },
        include: {
          run: {
            include: {
              character: true,
              runInventoryItems: { include: { itemCatalog: true } },
            },
          },
        },
      });
      expect(slotAfter?.run).toBeDefined();
      const runAfter = slotAfter!.run!;
      const hpAfter = runAfter.hp;
      const potionRowsAfter = runAfter.runInventoryItems.filter(
        (r) => r.itemCatalog.itemType === "POTION"
      );
      const potionQtyAfter = potionRowsAfter.reduce((sum, r) => sum + r.quantity, 0);

      const expectedHeal = Math.floor((hpMax * 25) / 100);
      expect(hpAfter).toBe(Math.min(hpMax, hpBefore + expectedHeal));
      expect(potionQtyAfter).toBe(potionQtyBefore - 1);
    });
  });
});
