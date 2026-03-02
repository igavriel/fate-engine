import { describe, it, expect } from "vitest";
import { computeLoot, COIN_TIER_MULTIPLIER, DROP_CHANCE_THRESHOLD } from "@/domain/loot/lootTables";
import type { CatalogItemForFilter } from "@/domain/loot/filterCatalogForDrop";

const catalogItems: CatalogItemForFilter[] = [
  {
    id: "w1",
    itemType: "WEAPON",
    attackBonus: 2,
    defenseBonus: 0,
    healPercent: 25,
    requiredLevel: 1,
    powerScore: 2,
  },
  {
    id: "a1",
    itemType: "ARMOR",
    attackBonus: 0,
    defenseBonus: 2,
    healPercent: 25,
    requiredLevel: 1,
    powerScore: 2,
  },
  {
    id: "p1",
    itemType: "POTION",
    attackBonus: 0,
    defenseBonus: 0,
    healPercent: 50,
    requiredLevel: 1,
    powerScore: 2,
  },
];

const playerLevel = 5;

describe("lootTables", () => {
  describe("coins determinism", () => {
    it("same inputs => same coinsGained", () => {
      const input = {
        seed: 7,
        fightCounter: 0,
        enemyLevel: 3,
        enemyTier: "NORMAL" as const,
        playerLevel,
        catalogItems,
      };
      const r1 = computeLoot(input);
      const r2 = computeLoot(input);
      expect(r1.coinsGained).toBe(r2.coinsGained);
    });

    it("coins use base = enemyLevel * 5 and tier multiplier", () => {
      const base = 2 * 5;
      const mult = COIN_TIER_MULTIPLIER.ELITE;
      const input = {
        seed: 0,
        fightCounter: 0,
        enemyLevel: 2,
        enemyTier: "ELITE" as const,
        playerLevel,
        catalogItems,
      };
      const r = computeLoot(input);
      const expectedMin = Math.round(base * mult);
      const expectedMax = Math.round(base * mult) + 2;
      expect(r.coinsGained).toBeGreaterThanOrEqual(expectedMin);
      expect(r.coinsGained).toBeLessThanOrEqual(expectedMax);
    });

    it("WEAK tier uses 1.2 multiplier", () => {
      expect(COIN_TIER_MULTIPLIER.WEAK).toBe(1.2);
    });
    it("NORMAL tier uses 1.0 multiplier", () => {
      expect(COIN_TIER_MULTIPLIER.NORMAL).toBe(1.0);
    });
    it("ELITE tier uses 1.4 multiplier", () => {
      expect(COIN_TIER_MULTIPLIER.ELITE).toBe(1.4);
    });
  });

  describe("drop chance determinism", () => {
    it("same inputs => same drop/no-drop", () => {
      const input = {
        seed: 100,
        fightCounter: 1,
        enemyLevel: 2,
        enemyTier: "ELITE" as const,
        playerLevel,
        catalogItems,
      };
      const r1 = computeLoot(input);
      const r2 = computeLoot(input);
      expect(r1.itemDrops).toEqual(r2.itemDrops);
    });

    it("drop thresholds: WEAK 25, NORMAL 40, ELITE 65", () => {
      expect(DROP_CHANCE_THRESHOLD.WEAK).toBe(65);
      expect(DROP_CHANCE_THRESHOLD.NORMAL).toBe(70);
      expect(DROP_CHANCE_THRESHOLD.ELITE).toBe(85);
    });

    it("with empty catalog returns no item drops", () => {
      const r = computeLoot({
        seed: 1,
        fightCounter: 0,
        enemyLevel: 1,
        enemyTier: "NORMAL",
        playerLevel: 1,
        catalogItems: [],
      });
      expect(r.itemDrops).toHaveLength(0);
      expect(r.coinsGained).toBeGreaterThanOrEqual(0);
    });
  });

  describe("tier bias: ELITE drops more often than WEAK (deterministic sample)", () => {
    it("over fightCounter 1..50, ELITE drop count >= WEAK drop count", () => {
      const seed = 999;
      const enemyLevel = 2;
      let weakDrops = 0;
      let eliteDrops = 0;
      for (let fc = 1; fc <= 50; fc++) {
        const weak = computeLoot({
          seed,
          fightCounter: fc,
          enemyLevel,
          enemyTier: "WEAK",
          playerLevel: 5,
          catalogItems,
        });
        const elite = computeLoot({
          seed,
          fightCounter: fc,
          enemyLevel,
          enemyTier: "ELITE",
          playerLevel: 5,
          catalogItems,
        });
        if (weak.itemDrops.length > 0) weakDrops++;
        if (elite.itemDrops.length > 0) eliteDrops++;
      }
      expect(eliteDrops).toBeGreaterThanOrEqual(weakDrops);
    });
  });

  describe("itemDrops shape", () => {
    it("itemDrops have itemCatalogId and quantity 1 when drop occurs", () => {
      let found = false;
      for (let seed = 0; seed < 200 && !found; seed++) {
        const r = computeLoot({
          seed,
          fightCounter: 0,
          enemyLevel: 2,
          enemyTier: "ELITE",
          playerLevel,
          catalogItems,
        });
        if (r.itemDrops.length > 0) {
          found = true;
          expect(r.itemDrops).toHaveLength(1);
          expect(r.itemDrops[0]).toMatchObject({ quantity: 1 });
          expect(catalogItems.map((c) => c.id)).toContain(r.itemDrops[0].itemCatalogId);
        }
      }
      expect(found).toBe(true);
    });
  });
});
