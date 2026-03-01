import { describe, it, expect } from "vitest";
import { computeEffectiveStats } from "@/domain/stats/computeEffectiveStats";

const baseStats = { attack: 5, defense: 5, luck: 4, hpMax: 20 };

describe("computeEffectiveStats", () => {
  it("returns base stats when no equipment bonuses", () => {
    expect(computeEffectiveStats(baseStats)).toEqual(baseStats);
    expect(computeEffectiveStats(baseStats, null, null)).toEqual(baseStats);
  });

  it("adds weapon attack bonus only", () => {
    expect(
      computeEffectiveStats(baseStats, { attackBonus: 2 }, null)
    ).toEqual({
      attack: 7,
      defense: 5,
      luck: 4,
      hpMax: 20,
    });
  });

  it("adds armor defense bonus only", () => {
    expect(
      computeEffectiveStats(baseStats, null, { defenseBonus: 3 })
    ).toEqual({
      attack: 5,
      defense: 8,
      luck: 4,
      hpMax: 20,
    });
  });

  it("adds both weapon and armor bonuses", () => {
    expect(
      computeEffectiveStats(
        baseStats,
        { attackBonus: 1 },
        { defenseBonus: 2 }
      )
    ).toEqual({
      attack: 6,
      defense: 7,
      luck: 4,
      hpMax: 20,
    });
  });
});
