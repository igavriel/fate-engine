import { describe, it, expect } from "vitest";
import { computeLevelUpGrowth } from "@/domain/progression/levelUp";

describe("computeLevelUpGrowth", () => {
  it("is deterministic: same seed and newLevel produce same statDelta", () => {
    const r1 = computeLevelUpGrowth({ seed: 99, newLevel: 2, species: "HUMAN" });
    const r2 = computeLevelUpGrowth({ seed: 99, newLevel: 2, species: "HUMAN" });
    expect(r1.statDelta).toEqual(r2.statDelta);
    expect(r1.fullHeal).toBe(true);
  });

  it("returns fullHeal true", () => {
    const r = computeLevelUpGrowth({ seed: 1, newLevel: 2, species: "ELF" });
    expect(r.fullHeal).toBe(true);
  });

  it("statDelta has positive values", () => {
    const r = computeLevelUpGrowth({ seed: 1, newLevel: 2, species: "MAGE" });
    expect(r.statDelta.attack).toBeGreaterThanOrEqual(1);
    expect(r.statDelta.defense).toBeGreaterThanOrEqual(1);
    expect(r.statDelta.luck).toBeGreaterThanOrEqual(1);
    expect(r.statDelta.hpMax).toBeGreaterThanOrEqual(2);
  });
});
