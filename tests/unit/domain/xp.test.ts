import { describe, it, expect } from "vitest";
import {
  xpGainedForKill,
  xpRequiredForLevel,
  addXp,
  applyLevelUps,
} from "@/domain/progression/xp";

describe("xp", () => {
  it("xpGainedForKill = enemyLevel * 10", () => {
    expect(xpGainedForKill(1)).toBe(10);
    expect(xpGainedForKill(3)).toBe(30);
    expect(xpGainedForKill(5)).toBe(50);
  });

  it("xpRequiredForLevel = level * 50", () => {
    expect(xpRequiredForLevel(1)).toBe(50);
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(3)).toBe(150);
  });

  it("addXp sums gained to current", () => {
    expect(addXp(0, 1, 10)).toBe(10);
    expect(addXp(20, 1, 30)).toBe(50);
  });

  it("applyLevelUps consumes xp and returns new level and remaining xp", () => {
    const r = applyLevelUps(60, 1);
    expect(r.newLevel).toBe(2);
    expect(r.remainingXp).toBe(10);
    expect(r.levelsGained).toBe(1);
  });

  it("applyLevelUps with no overflow leaves level unchanged", () => {
    const r = applyLevelUps(30, 1);
    expect(r.newLevel).toBe(1);
    expect(r.remainingXp).toBe(30);
    expect(r.levelsGained).toBe(0);
  });

  it("applyLevelUps can grant multiple levels", () => {
    const r = applyLevelUps(250, 1);
    expect(r.newLevel).toBe(3);
    expect(r.remainingXp).toBe(100);
    expect(r.levelsGained).toBe(2);
  });
});
