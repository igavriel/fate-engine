import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getStatus } from "@/app/api/game/status/route";
import { GET as getEnemies } from "@/app/api/game/enemies/route";
import { POST as startEncounter } from "@/app/api/game/encounter/start/route";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { gameStatusResponseSchema, enemiesResponseSchema } from "@/shared/zod/game";
import { ENEMY_SPECIES_IDS } from "@/domain/enemies/enemyPools";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

describe("create character then status and enemies", () => {
  let authCookie: string;
  const slotIndex = 1;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `create-status-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    const token = signToken({ sub: user.id, email: user.email });
    authCookie = `fe_auth=${encodeURIComponent(token)}`;
  });

  it("create character in slot 1, then fetch status and enemies and validate with Zod", async () => {
    if (!hasRealDb) return;

    // Ensure user has 3 slots (lazy creation via GET /api/game/slots)
    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({
          slotIndex,
          name: "TestHero",
          species: "HUMAN",
        }),
      })
    );
    expect(createRes.status).toBe(200);
    const createData = (await createRes.json()) as {
      slotIndex: number;
      characterId: string;
      runId: string;
    };
    expect(createData.characterId).toBeDefined();
    expect(createData.runId).toBeDefined();
    expect(createData.slotIndex).toBe(slotIndex);

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
      expect(statusParsed.data.slotIndex).toBe(slotIndex);
      expect(statusParsed.data.run.level).toBe(1);
      expect(statusParsed.data.run.lastOutcome).toBe("NONE");
      expect(statusParsed.data.run.equipped.weapon).toBeNull();
      expect(statusParsed.data.run.equipped.armor).toBeNull();
    }

    const enemiesRes = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(enemiesRes.status).toBe(200);
    const enemiesData = await enemiesRes.json();
    const enemiesParsed = enemiesResponseSchema.safeParse(enemiesData);
    expect(enemiesParsed.success).toBe(true);
    if (enemiesParsed.success) {
      expect(enemiesParsed.data.enemies).toHaveLength(3);
      expect(enemiesParsed.data.enemies.map((e) => e.tier)).toEqual(["WEAK", "NORMAL", "ELITE"]);
      for (const e of enemiesParsed.data.enemies) {
        expect(ENEMY_SPECIES_IDS).toContain(e.species);
        expect(e.name).toBeTruthy();
      }
    }
  });

  it("GET enemies multiple times (different fightCounter): species in pool, Zod valid", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({
          slotIndex: 2,
          name: "EnemyTestHero",
          species: "ELF",
        }),
      })
    );
    expect(createRes.status).toBe(200);

    const slotIndex = 2;

    const res1 = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    const parsed1 = enemiesResponseSchema.safeParse(data1);
    expect(parsed1.success).toBe(true);
    if (parsed1.success) {
      expect(parsed1.data.enemies).toHaveLength(3);
      for (const e of parsed1.data.enemies) {
        expect(ENEMY_SPECIES_IDS).toContain(e.species);
      }
    }

    const choiceId = (data1 as { enemies: { choiceId: string }[] }).enemies[0]!.choiceId;
    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({ slotIndex, choiceId }),
      })
    );
    expect(startRes.status).toBe(200);

    const res2 = await getEnemies(
      new Request(`http://localhost/api/game/enemies?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    const parsed2 = enemiesResponseSchema.safeParse(data2);
    expect(parsed2.success).toBe(true);
    if (parsed2.success) {
      expect(parsed2.data.enemies).toHaveLength(3);
      for (const e of parsed2.data.enemies) {
        expect(ENEMY_SPECIES_IDS).toContain(e.species);
      }
    }
  });
});
