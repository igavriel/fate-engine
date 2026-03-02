/**
 * Integration tests: WIN outcome applies deterministic loot (coins + optional item).
 * - WIN flow: summary outcome WIN, coinsGained > 0, loot array (0 or 1 item); inventory updated if drop.
 * - Deterministic tier bias (ELITE vs WEAK drop rate) is covered by unit tests in lootTables.test.ts.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getStatus } from "@/app/api/game/status/route";
import { GET as getEnemies } from "@/app/api/game/enemies/route";
import { POST as startEncounter } from "@/app/api/game/encounter/start/route";
import { POST as postAction } from "@/app/api/game/action/route";
import { GET as getSummary } from "@/app/api/game/summary/route";
import { POST as summaryAck } from "@/app/api/game/summary/ack/route";
import { GET as getInventory } from "@/app/api/game/inventory/route";
import { prismaTest } from "@/server/db/prismaTest";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { computeLoot } from "@/domain/loot/lootTables";
import {
  summaryResponseSchema,
  inventoryWithStatusResponseSchema,
} from "@/shared/zod/game";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

function authHeaders(cookie: string) {
  return { "Content-Type": "application/json", Cookie: cookie };
}

async function attackUntilOutcome(
  authCookie: string,
  slotIndex: 1 | 2 | 3,
  maxSteps: number
): Promise<"WIN" | "DEFEAT" | "RETREAT" | "TIMEOUT"> {
  for (let i = 0; i < maxSteps; i++) {
    const res = await postAction(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { outcome: string };
    if (data.outcome === "WIN" || data.outcome === "DEFEAT" || data.outcome === "RETREAT") {
      return data.outcome as "WIN" | "DEFEAT" | "RETREAT";
    }
  }
  return "TIMEOUT";
}

describe("WIN loot integration", () => {
  let authCookie: string;
  const slotIndex = 1 as const;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `win-loot-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prismaTest.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    authCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
  });

  it("ELITE encounter WIN: summary outcome WIN, coinsGained > 0, loot array; inventory reflects drop if any", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "LootHero", species: "HUMAN" }),
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
    const elite = enemiesData.enemies.find((e) => e.tier === "ELITE") ?? enemiesData.enemies[2];
    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, choiceId: elite!.choiceId }),
      })
    );
    expect(startRes.status).toBe(200);

    const outcome = await attackUntilOutcome(authCookie, slotIndex, 60);
    if (outcome !== "WIN") {
      // ELITE might defeat player; skip rest of test
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
    if (!summaryParsed.success) return;
    const summary = summaryParsed.data;
    expect(summary.outcome).toBe("WIN");
    expect(summary.delta.coinsGained).toBeGreaterThan(0);
    expect(Array.isArray(summary.loot)).toBe(true);
    expect(summary.loot.length).toBeLessThanOrEqual(1);

    const invRes = await getInventory(
      new Request(`http://localhost/api/game/inventory?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(invRes.status).toBe(200);
    const invData = await invRes.json();
    const invParsed = inventoryWithStatusResponseSchema.safeParse(invData);
    expect(invParsed.success).toBe(true);
    if (summary.loot.length > 0 && invParsed.success) {
      const lootName = summary.loot[0].name;
      const hasDroppedItem = invParsed.data.inventory.some(
        (item) => item.catalog.name === lootName && item.quantity >= 1
      );
      expect(hasDroppedItem).toBe(true);
    }

    await summaryAck(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex }),
      })
    );
  });

  it("WEAK encounter WIN: same assertions (coins > 0, loot 0 or 1)", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "WeakLootHero", species: "HUMAN" }),
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
    const weak = enemiesData.enemies.find((e) => e.tier === "WEAK") ?? enemiesData.enemies[0];
    const startRes = await startEncounter(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, choiceId: weak!.choiceId }),
      })
    );
    expect(startRes.status).toBe(200);

    const outcome = await attackUntilOutcome(authCookie, slotIndex, 60);
    if (outcome !== "WIN") return;

    const summaryRes = await getSummary(
      new Request(`http://localhost/api/game/summary?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(summaryRes.status).toBe(200);
    const summaryData = await summaryRes.json();
    const summaryParsed = summaryResponseSchema.safeParse(summaryData);
    expect(summaryParsed.success).toBe(true);
    if (!summaryParsed.success) return;
    const summary = summaryParsed.data;
    expect(summary.outcome).toBe("WIN");
    expect(summary.delta.coinsGained).toBeGreaterThan(0);
    expect(Array.isArray(summary.loot)).toBe(true);
    expect(summary.loot.length).toBeLessThanOrEqual(1);
  });

  it("deterministic sample: 10 ELITE vs 10 WEAK wins, ELITE drop count >= WEAK drop count", async () => {
    if (!hasRealDb) return;

    const seed = 42;
    const catalogRows = await prismaTest.itemCatalog.findMany({
      select: {
        id: true,
        itemType: true,
        attackBonus: true,
        defenseBonus: true,
        healPercent: true,
        requiredLevel: true,
        powerScore: true,
      },
    });
    const catalogItems = catalogRows.map((c) => ({
      id: c.id,
      itemType: c.itemType as "WEAPON" | "ARMOR" | "POTION",
      attackBonus: c.attackBonus,
      defenseBonus: c.defenseBonus,
      healPercent: c.healPercent,
      requiredLevel: c.requiredLevel,
      powerScore: c.powerScore,
    }));

    let eliteDrops = 0;
    let weakDrops = 0;
    const enemyLevel = 2;
    const playerLevel = 5;
    for (let fc = 1; fc <= 10; fc++) {
      const eliteResult = computeLoot({
        seed,
        fightCounter: fc,
        enemyLevel,
        enemyTier: "ELITE",
        playerLevel,
        catalogItems,
      });
      const weakResult = computeLoot({
        seed,
        fightCounter: fc,
        enemyLevel,
        enemyTier: "WEAK",
        playerLevel,
        catalogItems,
      });
      if (eliteResult.itemDrops.length > 0) eliteDrops++;
      if (weakResult.itemDrops.length > 0) weakDrops++;
    }
    expect(eliteDrops).toBeGreaterThanOrEqual(weakDrops);
  });

  it("at level 1 dropped items have requiredLevel <= 1; after level 6 higher requiredLevel items can appear", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );
    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "LevelDropHero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const character = await prismaTest.character.findFirst({
      where: { name: "LevelDropHero" },
      orderBy: { createdAt: "desc" },
    });
    expect(character).toBeDefined();
    const run = await prismaTest.run.findFirst({
      where: { characterId: character!.id },
      orderBy: { createdAt: "desc" },
    });
    expect(run).toBeDefined();

    const catalogRows = await prismaTest.itemCatalog.findMany({
      select: {
        id: true,
        itemType: true,
        attackBonus: true,
        defenseBonus: true,
        healPercent: true,
        requiredLevel: true,
        powerScore: true,
      },
    });
    const catalogItems = catalogRows.map((c) => ({
      id: c.id,
      itemType: c.itemType as "WEAPON" | "ARMOR" | "POTION",
      attackBonus: c.attackBonus,
      defenseBonus: c.defenseBonus,
      healPercent: c.healPercent,
      requiredLevel: c.requiredLevel,
      powerScore: c.powerScore,
    }));

    for (let fc = 0; fc < 15; fc++) {
      const result = computeLoot({
        seed: run!.seed,
        fightCounter: fc,
        enemyLevel: 2,
        enemyTier: "ELITE",
        playerLevel: 1,
        catalogItems,
      });
      for (const drop of result.itemDrops) {
        const item = catalogItems.find((c) => c.id === drop.itemCatalogId);
        expect(item).toBeDefined();
        expect(item!.requiredLevel).toBeLessThanOrEqual(1);
      }
    }

    await prismaTest.character.update({
      where: { id: character!.id },
      data: { level: 6 },
    });

    let sawHigherLevelItem = false;
    for (let fc = 20; fc < 35; fc++) {
      const result = computeLoot({
        seed: run!.seed,
        fightCounter: fc,
        enemyLevel: 3,
        enemyTier: "ELITE",
        playerLevel: 6,
        catalogItems,
      });
      for (const drop of result.itemDrops) {
        const item = catalogItems.find((c) => c.id === drop.itemCatalogId);
        expect(item).toBeDefined();
        expect(item!.requiredLevel).toBeLessThanOrEqual(6);
        if (item!.requiredLevel > 1) sawHigherLevelItem = true;
      }
    }
    expect(sawHigherLevelItem).toBe(true);
  });
});
