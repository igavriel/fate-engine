import { describe, it, expect } from "vitest";
import { generateLoot } from "@/domain/loot/generateLoot";

describe("generateLoot", () => {
  const catalogIds = ["id-a", "id-b", "id-c"];

  it("is deterministic: same inputs => same coins and itemDrops", () => {
    const input = {
      seed: 7,
      fightCounter: 0,
      enemyLevel: 2,
      enemyTier: "NORMAL",
      catalogIds,
    };
    const r1 = generateLoot(input);
    const r2 = generateLoot(input);
    expect(r1.coinsGained).toBe(r2.coinsGained);
    expect(r1.itemDrops).toEqual(r2.itemDrops);
  });

  it("returns coinsGained >= 0", () => {
    const r = generateLoot({
      seed: 1,
      fightCounter: 0,
      enemyLevel: 1,
      enemyTier: "WEAK",
      catalogIds,
    });
    expect(r.coinsGained).toBeGreaterThanOrEqual(0);
  });

  it("itemDrops have itemCatalogId and quantity", () => {
    const input = {
      seed: 999,
      fightCounter: 1,
      enemyLevel: 3,
      enemyTier: "TOUGH",
      catalogIds,
    };
    const r = generateLoot(input);
    for (const drop of r.itemDrops) {
      expect(catalogIds).toContain(drop.itemCatalogId);
      expect(drop.quantity).toBe(1);
    }
  });

  it("with empty catalogIds returns no item drops", () => {
    const r = generateLoot({
      seed: 1,
      fightCounter: 0,
      enemyLevel: 1,
      enemyTier: "NORMAL",
      catalogIds: [],
    });
    expect(r.itemDrops).toHaveLength(0);
    expect(r.coinsGained).toBeGreaterThanOrEqual(0);
  });
});
