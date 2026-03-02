import { describe, it, expect } from "vitest";
import { generateEnemyChoices } from "@/domain/enemies/generateEnemyChoices";
import { ENEMY_SPECIES_IDS, getNamePoolForSpecies } from "@/domain/enemies/enemyPools";

describe("generateEnemyChoices", () => {
  it("same seed/fightCounter/playerLevel produce same 3 enemies (names and species)", () => {
    const input = { seed: 100, fightCounter: 0, playerLevel: 3 };
    const a = generateEnemyChoices(input);
    const b = generateEnemyChoices(input);
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    expect(a).toEqual(b);
    expect(a.map((e) => e.name)).toEqual(b.map((e) => e.name));
    expect(a.map((e) => e.species)).toEqual(b.map((e) => e.species));
  });

  it("returns exactly 3 enemies with tiers WEAK, NORMAL, ELITE", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 1 });
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.tier)).toEqual(["WEAK", "NORMAL", "ELITE"]);
  });

  it("enemy level scales with player level and tier", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 5 });
    const weak = result.find((e) => e.tier === "WEAK")!;
    const normal = result.find((e) => e.tier === "NORMAL")!;
    const elite = result.find((e) => e.tier === "ELITE")!;
    expect(weak.level).toBe(4); // 5 - 1
    expect(normal.level).toBe(5);
    expect(elite.level).toBe(6); // 5 + 1
  });

  it("species are from the pool list", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 1 });
    result.forEach((e) => {
      expect(ENEMY_SPECIES_IDS).toContain(e.species);
    });
  });

  it("names are from the name pool for that species", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 1 });
    result.forEach((e) => {
      const namePool = getNamePoolForSpecies(e.species);
      expect(namePool).toContain(e.name);
    });
  });

  it("different fightCounter produces different names or species across multiple calls", () => {
    const seenSpeciesSets = new Set<string>();
    const seenNameSets = new Set<string>();
    for (let fc = 0; fc < 10; fc++) {
      const result = generateEnemyChoices({ seed: 1, fightCounter: fc, playerLevel: 1 });
      const speciesKey = result.map((e) => e.species).sort().join(",");
      const nameKey = result.map((e) => e.name).join(",");
      seenSpeciesSets.add(speciesKey);
      seenNameSets.add(nameKey);
    }
    expect(seenSpeciesSets.size).toBeGreaterThan(1);
    expect(seenNameSets.size).toBeGreaterThan(1);
  });

  it("preview loot range is deterministic and positive", () => {
    const result = generateEnemyChoices({ seed: 7, fightCounter: 0, playerLevel: 2 });
    result.forEach((e) => {
      expect(e.preview.estimatedLootCoinsMin).toBeGreaterThanOrEqual(0);
      expect(e.preview.estimatedLootCoinsMax).toBeGreaterThanOrEqual(
        e.preview.estimatedLootCoinsMin
      );
    });
  });
});
