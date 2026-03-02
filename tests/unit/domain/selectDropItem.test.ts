import { describe, it, expect } from "vitest";
import { createRng } from "@/domain/rng/createRng";
import {
  selectDropItem,
  MAX_POWER_BY_TIER,
  type CatalogItemForLoot,
} from "@/domain/loot/selectDropItem";

function powerScore(item: CatalogItemForLoot): number {
  if (item.itemType === "POTION") return Math.ceil(item.healPercent / 25);
  return Math.max(item.attackBonus, item.defenseBonus);
}

const allCatalog: CatalogItemForLoot[] = [
  { id: "w1", itemType: "WEAPON", attackBonus: 1, defenseBonus: 0, healPercent: 25 },
  { id: "w2", itemType: "WEAPON", attackBonus: 2, defenseBonus: 0, healPercent: 25 },
  { id: "w3", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25 },
  { id: "w4", itemType: "WEAPON", attackBonus: 6, defenseBonus: 0, healPercent: 25 },
  { id: "a1", itemType: "ARMOR", attackBonus: 0, defenseBonus: 2, healPercent: 25 },
  { id: "a2", itemType: "ARMOR", attackBonus: 0, defenseBonus: 5, healPercent: 25 },
  { id: "p1", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 25 },
  { id: "p2", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 100 },
];

describe("selectDropItem", () => {
  describe("powerScore", () => {
    it("equipment: max(attackBonus, defenseBonus)", () => {
      expect(powerScore(allCatalog[0])).toBe(1);
      expect(powerScore(allCatalog[2])).toBe(4);
      expect(powerScore(allCatalog[4])).toBe(2);
    });
    it("potion: ceil(healPercent/25)", () => {
      expect(powerScore(allCatalog[6])).toBe(1);
      expect(powerScore(allCatalog[7])).toBe(4);
    });
  });

  describe("tier filtering via selectDropItem", () => {
    it("WEAK returns only items with powerScore <= 2 from catalog", () => {
      for (let seed = 0; seed < 50; seed++) {
        const result = selectDropItem({
          rng: createRng(seed),
          enemyTier: "WEAK",
          catalogItems: allCatalog,
        });
        const chosen = allCatalog.find((c) => c.id === result.itemCatalogId)!;
        expect(chosen).toBeDefined();
        expect(powerScore(chosen)).toBeLessThanOrEqual(MAX_POWER_BY_TIER.WEAK);
      }
    });

    it("NORMAL returns only items with powerScore <= 3", () => {
      for (let seed = 100; seed < 120; seed++) {
        const result = selectDropItem({
          rng: createRng(seed),
          enemyTier: "NORMAL",
          catalogItems: allCatalog,
        });
        const chosen = allCatalog.find((c) => c.id === result.itemCatalogId)!;
        expect(chosen).toBeDefined();
        expect(powerScore(chosen)).toBeLessThanOrEqual(MAX_POWER_BY_TIER.NORMAL);
      }
    });

    it("ELITE can return items with powerScore <= 5", () => {
      for (let seed = 200; seed < 220; seed++) {
        const result = selectDropItem({
          rng: createRng(seed),
          enemyTier: "ELITE",
          catalogItems: allCatalog,
        });
        const chosen = allCatalog.find((c) => c.id === result.itemCatalogId)!;
        expect(chosen).toBeDefined();
        expect(powerScore(chosen)).toBeLessThanOrEqual(MAX_POWER_BY_TIER.ELITE);
      }
    });

    it("fallback: when no items match tier filter, returns one from full catalog", () => {
      const onlyStrong: CatalogItemForLoot[] = [
        { id: "x", itemType: "WEAPON", attackBonus: 10, defenseBonus: 0, healPercent: 25 },
      ];
      const result = selectDropItem({
        rng: createRng(1),
        enemyTier: "WEAK",
        catalogItems: onlyStrong,
      });
      expect(result.itemCatalogId).toBe("x");
      expect(result.quantity).toBe(1);
    });
  });

  describe("selectDropItem return shape", () => {
    it("always returns quantity 1 and valid itemCatalogId", () => {
      const result = selectDropItem({
        rng: createRng(1),
        enemyTier: "WEAK",
        catalogItems: allCatalog,
      });
      expect(result.quantity).toBe(1);
      expect(allCatalog.map((c) => c.id)).toContain(result.itemCatalogId);
    });
  });

  describe("fallback when filtered by type is empty", () => {
    it("picks from tier-filtered pool (only weapons catalog)", () => {
      const onlyWeapons: CatalogItemForLoot[] = [
        { id: "w1", itemType: "WEAPON", attackBonus: 1, defenseBonus: 0, healPercent: 25 },
      ];
      const result = selectDropItem({
        rng: createRng(1),
        enemyTier: "WEAK",
        catalogItems: onlyWeapons,
      });
      expect(result.itemCatalogId).toBe("w1");
      expect(result.quantity).toBe(1);
    });
  });

  describe("selectDropItem determinism", () => {
    it("same rng + same inputs => same item", () => {
      const rng = createRng(123);
      const r1 = selectDropItem({ rng: createRng(123), enemyTier: "NORMAL", catalogItems: allCatalog });
      const r2 = selectDropItem({ rng: createRng(123), enemyTier: "NORMAL", catalogItems: allCatalog });
      expect(r1.itemCatalogId).toBe(r2.itemCatalogId);
      expect(r1.quantity).toBe(1);
      expect(r2.quantity).toBe(1);
    });
  });

  describe("MAX_POWER_BY_TIER", () => {
    it("WEAK 2, NORMAL 3, ELITE 5", () => {
      expect(MAX_POWER_BY_TIER.WEAK).toBe(2);
      expect(MAX_POWER_BY_TIER.NORMAL).toBe(3);
      expect(MAX_POWER_BY_TIER.ELITE).toBe(5);
    });
  });
});
