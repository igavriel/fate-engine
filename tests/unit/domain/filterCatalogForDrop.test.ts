import { describe, it, expect } from "vitest";
import {
  filterCatalogForDrop,
  BRACKET_POWER_CAP_BY_TIER,
  type CatalogItemForFilter,
} from "@/domain/loot/filterCatalogForDrop";

const makeItem = (
  id: string,
  itemType: "WEAPON" | "ARMOR" | "POTION",
  requiredLevel: number,
  powerScore: number,
  overrides: Partial<CatalogItemForFilter> = {}
): CatalogItemForFilter => ({
  id,
  itemType,
  attackBonus: itemType === "WEAPON" ? powerScore : 0,
  defenseBonus: itemType === "ARMOR" ? powerScore : 0,
  healPercent: itemType === "POTION" ? powerScore * 25 : 25,
  requiredLevel,
  powerScore,
  ...overrides,
});

describe("filterCatalogForDrop", () => {
  describe("base eligibility: requiredLevel <= playerLevel", () => {
    it("returns only items with requiredLevel <= playerLevel", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("a", "WEAPON", 1, 1),
        makeItem("b", "WEAPON", 3, 2),
        makeItem("c", "WEAPON", 10, 3),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "NORMAL",
      });
      expect(result.map((i) => i.id).sort()).toEqual(["a", "b"]);
      expect(result.every((i) => i.requiredLevel <= 5)).toBe(true);
    });

    it("at level 1 only requiredLevel 1 items", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("low", "WEAPON", 1, 1),
        makeItem("high", "WEAPON", 5, 3),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 1,
        tier: "ELITE",
      });
      expect(result.map((i) => i.id)).toEqual(["low"]);
    });
  });

  describe("bracket preference", () => {
    it("prefers items in current bracket when tier allows", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("l1", "WEAPON", 1, 1),
        makeItem("l5", "WEAPON", 5, 2),
        makeItem("l6", "WEAPON", 6, 2),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 6,
        tier: "NORMAL",
      });
      expect(result.map((i) => i.id)).toContain("l6");
      expect(result.every((i) => i.requiredLevel >= 6 && i.requiredLevel <= 6)).toBe(true);
    });
  });

  describe("tier caps: ELITE allows higher powerScore than WEAK", () => {
    it("WEAK caps powerScore <= 2", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("p1", "WEAPON", 1, 1),
        makeItem("p2", "WEAPON", 1, 2),
        makeItem("p3", "WEAPON", 1, 3),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "WEAK",
      });
      expect(result.every((i) => i.powerScore <= BRACKET_POWER_CAP_BY_TIER.WEAK)).toBe(true);
      expect(result.map((i) => i.id).sort()).toEqual(["p1", "p2"]);
    });

    it("NORMAL caps powerScore <= 3", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("p2", "WEAPON", 1, 2),
        makeItem("p3", "WEAPON", 1, 3),
        makeItem("p4", "WEAPON", 1, 4),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "NORMAL",
      });
      expect(result.every((i) => i.powerScore <= BRACKET_POWER_CAP_BY_TIER.NORMAL)).toBe(true);
      expect(result.map((i) => i.id).sort()).toEqual(["p2", "p3"]);
    });

    it("ELITE allows powerScore <= 5", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("p3", "WEAPON", 1, 3),
        makeItem("p5", "WEAPON", 1, 5),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "ELITE",
      });
      expect(result.every((i) => i.powerScore <= BRACKET_POWER_CAP_BY_TIER.ELITE)).toBe(true);
      expect(result.map((i) => i.id).sort()).toEqual(["p3", "p5"]);
    });
  });

  describe("fallback when bracket filter empty", () => {
    it("falls back to requiredLevel <= playerLevel when no items in bracket", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("low", "WEAPON", 1, 1),
        makeItem("mid", "WEAPON", 3, 2),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 10,
        tier: "WEAK",
      });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((i) => i.requiredLevel <= 10)).toBe(true);
    });

    it("falls back to level-eligible only when tier filter empty", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("high", "WEAPON", 1, 5),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "WEAK",
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("high");
    });

    it("returns entire catalog when no level-eligible items (defensive)", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("high", "WEAPON", 10, 1),
      ];
      const result = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 1,
        tier: "ELITE",
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("high");
    });
  });

  describe("empty catalog", () => {
    it("returns empty array", () => {
      const result = filterCatalogForDrop({
        catalogItems: [],
        playerLevel: 5,
        tier: "NORMAL",
      });
      expect(result).toEqual([]);
    });
  });

  describe("BRACKET_POWER_CAP_BY_TIER", () => {
    it("WEAK 2, NORMAL 3, ELITE 5", () => {
      expect(BRACKET_POWER_CAP_BY_TIER.WEAK).toBe(2);
      expect(BRACKET_POWER_CAP_BY_TIER.NORMAL).toBe(3);
      expect(BRACKET_POWER_CAP_BY_TIER.ELITE).toBe(5);
    });
  });

  describe("determinism", () => {
    it("same inputs produce same filtered list", () => {
      const catalog: CatalogItemForFilter[] = [
        makeItem("a", "WEAPON", 1, 1),
        makeItem("b", "ARMOR", 3, 2),
      ];
      const r1 = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "NORMAL",
      });
      const r2 = filterCatalogForDrop({
        catalogItems: catalog,
        playerLevel: 5,
        tier: "NORMAL",
      });
      expect(r1.map((i) => i.id).sort()).toEqual(r2.map((i) => i.id).sort());
    });
  });
});
