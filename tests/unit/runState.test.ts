import { describe, it, expect } from "vitest";
import { getRunState, capCombatLog, COMBAT_LOG_MAX_ENTRIES } from "@/server/game/runState";

describe("getRunState", () => {
  it("returns default state for null", () => {
    const state = getRunState(null);
    expect(state.version).toBe(1);
    expect(state.log).toEqual([]);
    expect(state.encounter).toBeUndefined();
    expect(state.summary).toBeUndefined();
  });

  it("returns default state for undefined", () => {
    const state = getRunState(undefined);
    expect(state.version).toBe(1);
    expect(state.log).toEqual([]);
  });

  it("returns default state for non-object (string)", () => {
    const state = getRunState("not an object");
    expect(state.version).toBe(1);
    expect(state.log).toEqual([]);
  });

  it("returns default state for non-object (number)", () => {
    const state = getRunState(42);
    expect(state.version).toBe(1);
  });

  it("parses valid stateJson with encounter and log", () => {
    const stateJson = {
      version: 1,
      encounter: {
        encounterId: "enc-1",
        enemy: {
          choiceId: "e-1",
          name: "Goblin",
          species: "Beast",
          level: 1,
          tier: "WEAK",
          attack: 2,
          defense: 1,
        },
        enemyHp: 10,
        enemyHpMax: 12,
      },
      log: [{ t: "2025-01-01T00:00:00.000Z", text: "Encounter started." }],
      summary: null,
    };
    const state = getRunState(stateJson);
    expect(state.version).toBe(1);
    expect(state.encounter?.encounterId).toBe("enc-1");
    expect(state.encounter?.enemy.name).toBe("Goblin");
    expect(state.log).toHaveLength(1);
    expect(state.log[0]!.text).toBe("Encounter started.");
    expect(state.summary).toBeNull();
  });

  it("uses empty log when log is not an array", () => {
    const state = getRunState({ version: 1, log: "invalid" });
    expect(state.log).toEqual([]);
  });

  it("preserves summary when present", () => {
    const stateJson = {
      version: 1,
      log: [],
      summary: {
        outcome: "WIN",
        enemy: { name: "Orc", species: "Humanoid", level: 2 },
        delta: { xpGained: 20, coinsGained: 10, hpChange: 0 },
        loot: [],
        leveledUp: false,
      },
    };
    const state = getRunState(stateJson);
    expect(state.summary?.outcome).toBe("WIN");
    expect(state.summary?.enemy.name).toBe("Orc");
  });

  it("uses version 1 when version is missing", () => {
    const state = getRunState({ log: [] });
    expect(state.version).toBe(1);
  });
});

describe("capCombatLog", () => {
  it("keeps only last N entries and preserves order", () => {
    const log = Array.from({ length: 60 }, (_, i) => ({
      t: `2025-01-01T00:00:${String(i).padStart(2, "0")}.000Z`,
      text: `entry ${i}`,
    }));
    const capped = capCombatLog(log, 50);
    expect(capped).toHaveLength(50);
    expect(capped[0]).toEqual(log[10]);
    expect(capped[49]).toEqual(log[59]);
  });
});
