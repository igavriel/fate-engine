import { describe, it, expect } from "vitest";
import {
  ENEMY_SPECIES_IDS,
  ENEMY_POOLS,
  SPECIES_LIST,
  getSpeciesStats,
  getNamePoolForSpecies,
} from "@/domain/enemies/enemyPools";

describe("enemyPools", () => {
  it("ENEMY_SPECIES_IDS has 10-15 species", () => {
    expect(ENEMY_SPECIES_IDS.length).toBeGreaterThanOrEqual(10);
    expect(ENEMY_SPECIES_IDS.length).toBeLessThanOrEqual(15);
  });

  it("SPECIES_LIST matches ENEMY_SPECIES_IDS", () => {
    expect(SPECIES_LIST).toEqual(ENEMY_SPECIES_IDS);
  });

  it("each species has 8-20 names", () => {
    for (const id of ENEMY_SPECIES_IDS) {
      const def = ENEMY_POOLS[id];
      expect(def.names.length).toBeGreaterThanOrEqual(8);
      expect(def.names.length).toBeLessThanOrEqual(20);
    }
  });

  it("each species has hpMult, atkMult, defMult", () => {
    for (const id of ENEMY_SPECIES_IDS) {
      const def = ENEMY_POOLS[id];
      expect(typeof def.hpMult).toBe("number");
      expect(typeof def.atkMult).toBe("number");
      expect(typeof def.defMult).toBe("number");
    }
  });

  it("getSpeciesStats returns multipliers for known species", () => {
    const stats = getSpeciesStats("GOBLIN");
    expect(stats.hpMult).toBe(0.85);
    expect(stats.atkMult).toBe(1);
    expect(stats.defMult).toBe(0.8);
  });

  it("getSpeciesStats returns 1,1,1 for unknown species", () => {
    const stats = getSpeciesStats("UNKNOWN_SPECIES");
    expect(stats).toEqual({ hpMult: 1, atkMult: 1, defMult: 1 });
  });

  it("getNamePoolForSpecies returns names for known species", () => {
    const names = getNamePoolForSpecies("TROLL");
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThanOrEqual(8);
    expect(ENEMY_POOLS.TROLL.names).toEqual(names);
  });

  it("getNamePoolForSpecies returns empty array for unknown species", () => {
    const names = getNamePoolForSpecies("NOT_A_SPECIES");
    expect(names).toEqual([]);
  });
});
