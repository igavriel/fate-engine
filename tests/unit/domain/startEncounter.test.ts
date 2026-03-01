import { describe, it, expect } from "vitest";
import { startEncounter } from "@/domain/combat/startEncounter";

describe("startEncounter", () => {
  const chosenEnemy = {
    choiceId: "enemy-42-0-1",
    tier: "NORMAL" as const,
    name: "Orc",
    species: "Humanoid",
    level: 2,
    preview: { estimatedLootCoinsMin: 8, estimatedLootCoinsMax: 16 },
  };

  it("is deterministic: same inputs produce same enemy snapshot", () => {
    const input = {
      seed: 100,
      fightCounter: 0,
      playerLevel: 1,
      chosenEnemy,
      encounterId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      now: "2025-01-01T12:00:00.000Z",
    };
    const r1 = startEncounter(input);
    const r2 = startEncounter(input);
    expect(r1.encounterId).toBe(r2.encounterId);
    expect(r1.enemy.name).toBe(r2.enemy.name);
    expect(r1.enemy.level).toBe(r2.enemy.level);
    expect(r1.enemyHp).toBe(r2.enemyHp);
    expect(r1.enemyHpMax).toBe(r2.enemyHpMax);
    expect(r1.nextFightCounter).toBe(1);
  });

  it("increments fightCounter by 1", () => {
    const result = startEncounter({
      seed: 1,
      fightCounter: 3,
      playerLevel: 1,
      chosenEnemy,
      encounterId: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
      now: "2025-01-01T12:00:00.000Z",
    });
    expect(result.nextFightCounter).toBe(4);
  });

  it("returns initial log entry", () => {
    const result = startEncounter({
      seed: 1,
      fightCounter: 0,
      playerLevel: 1,
      chosenEnemy,
      encounterId: "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3",
      now: "2025-06-15T00:00:00.000Z",
    });
    expect(result.initialLogEntry.t).toBe("2025-06-15T00:00:00.000Z");
    expect(result.initialLogEntry.text).toContain("Encounter started");
    expect(result.initialLogEntry.text).toContain("Orc");
    expect(result.initialLogEntry.text).toContain("Lv.2");
  });
});
