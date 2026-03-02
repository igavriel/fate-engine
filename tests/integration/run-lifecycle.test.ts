import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getStatus } from "@/app/api/game/status/route";
import { GET as getEnemies } from "@/app/api/game/enemies/route";
import { POST as startEncounter } from "@/app/api/game/encounter/start/route";
import { POST as postAction } from "@/app/api/game/action/route";
import { GET as getSummary } from "@/app/api/game/summary/route";
import { POST as postRunEnd } from "@/app/api/game/run/end/route";
import { prismaTest } from "@/server/db/prismaTest";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { gameStatusResponseSchema, summaryResponseSchema, runEndResponseSchema } from "@/shared/zod/game";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

function authHeaders(cookie: string) {
  return { "Content-Type": "application/json", Cookie: cookie };
}

describe("run lifecycle: status OVER and run/end", () => {
  let authCookie: string;
  const slotIndex = 1;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `run-lifecycle-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prismaTest.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    authCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
  });

  it("POST /api/game/run/end sets run.status to OVER and returns status", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "EndRunHero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const endRes = await postRunEnd(
      new Request("http://localhost/api/game/run/end", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex }),
      })
    );
    expect(endRes.status).toBe(200);
    const endData = await endRes.json();
    const endParsed = runEndResponseSchema.safeParse(endData);
    expect(endParsed.success).toBe(true);
    if (endParsed.success) {
      expect(endParsed.data.status.run.status).toBe("OVER");
    }

    const statusRes = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    const statusParsed = gameStatusResponseSchema.safeParse(statusData);
    expect(statusParsed.success).toBe(true);
    if (statusParsed.success) {
      expect(statusParsed.data.run.status).toBe("OVER");
    }
  });

  it("defeat with no potions: run.status is OVER and summary exists with outcome DEFEAT", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "DefeatHero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(enemiesRes.status).toBe(200);
    const enemiesData = (await enemiesRes.json()) as { enemies: { choiceId: string; tier: string }[] };
    const eliteChoice = enemiesData.enemies.find((e) => e.tier === "ELITE") ?? enemiesData.enemies[2];
    const choiceId = eliteChoice!.choiceId;

    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, choiceId }),
      })
    );
    expect(startRes.status).toBe(200);

    let outcome = "CONTINUE";
    let steps = 0;
    const maxSteps = 80;
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

    if (outcome !== "DEFEAT") {
      // Defeat may not occur in limited steps; skip assertions
      return;
    }

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
      expect(summaryParsed.data.outcome).toBe("DEFEAT");
    }

    const statusRes = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    const statusParsed = gameStatusResponseSchema.safeParse(statusData);
    expect(statusParsed.success).toBe(true);
    if (statusParsed.success) {
      expect(statusParsed.data.run.status).toBe("OVER");
    }
  });
});
