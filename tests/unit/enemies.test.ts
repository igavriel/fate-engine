import { describe, it, expect } from "vitest";
import { generateEnemyChoices } from "@/domain/enemies/generateEnemyChoices";

describe("generateEnemyChoices", () => {
  it("same inputs produce same enemies", () => {
    const input = { seed: 100, fightCounter: 0, playerLevel: 3 };
    const a = generateEnemyChoices(input);
    const b = generateEnemyChoices(input);
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    expect(a).toEqual(b);
  });

  it("returns exactly 3 enemies with tiers WEAK, NORMAL, TOUGH", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 1 });
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.tier)).toEqual(["WEAK", "NORMAL", "TOUGH"]);
  });

  it("enemy level scales with player level and tier", () => {
    const result = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 5 });
    const weak = result.find((e) => e.tier === "WEAK")!;
    const normal = result.find((e) => e.tier === "NORMAL")!;
    const tough = result.find((e) => e.tier === "TOUGH")!;
    expect(weak.level).toBe(4); // 5 - 1
    expect(normal.level).toBe(5);
    expect(tough.level).toBe(6); // 5 + 1
  });

  it("different fightCounter produces different names/species", () => {
    const a = generateEnemyChoices({ seed: 1, fightCounter: 0, playerLevel: 1 });
    const b = generateEnemyChoices({ seed: 1, fightCounter: 1, playerLevel: 1 });
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    const namesA = a.map((e) => e.name).join(",");
    const namesB = b.map((e) => e.name).join(",");
    expect(namesA).not.toEqual(namesB);
  });

  it("preview loot range is deterministic and positive", () => {
    const result = generateEnemyChoices({ seed: 7, fightCounter: 0, playerLevel: 2 });
    result.forEach((e) => {
      expect(e.preview.estimatedLootCoinsMin).toBeGreaterThanOrEqual(0);
      expect(e.preview.estimatedLootCoinsMax).toBeGreaterThanOrEqual(e.preview.estimatedLootCoinsMin);
    });
  });
});
