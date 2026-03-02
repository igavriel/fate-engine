import { describe, it, expect } from "vitest";
import { resolveCombatAction } from "@/domain/combat/resolveCombatAction";

const baseEncounter = {
  enemy: {
    choiceId: "e-1-0-0",
    name: "Goblin",
    species: "Beast",
    level: 1,
    tier: "WEAK" as const,
    attack: 3,
    defense: 1,
  },
  enemyHp: 10,
};

const baseInput = {
  seed: 42,
  turnCounter: 0,
  playerHp: 20,
  playerHpMax: 20,
  playerAttack: 5,
  playerDefense: 2,
  playerLuck: 3,
  playerCoins: 50,
  encounter: { ...baseEncounter },
  action: "ATTACK" as const,
  canHeal: false,
  healPercent: 25,
};

describe("resolveCombatAction", () => {
  it("ATTACK is deterministic: same inputs => same damage and outcome", () => {
    const r1 = resolveCombatAction(baseInput);
    const r2 = resolveCombatAction(baseInput);
    expect(r1.nextTurnCounter).toBe(1);
    expect(r2.nextTurnCounter).toBe(1);
    expect(r1.enemyHpAfter).toBe(r2.enemyHpAfter);
    expect(r1.hpDelta).toBe(r2.hpDelta);
    expect(r1.outcome).toBe(r2.outcome);
    expect(r1.logEntry.text).toBe(r2.logEntry.text);
  });

  it("RETREAT always succeeds and applies 10% coin penalty", () => {
    const result = resolveCombatAction({
      ...baseInput,
      action: "RETREAT",
      playerCoins: 100,
    });
    expect(result.outcome).toBe("RETREAT");
    expect(result.coinsDelta).toBe(-10);
    expect(result.hpDelta).toBe(0);
    expect(result.enemyHpAfter).toBe(baseEncounter.enemyHp);
    expect(result.logEntry.text).toContain("Retreated");
    expect(result.logEntry.text).toContain("10");
  });

  it("HEAL with canHeal true returns healIntent and hpDelta", () => {
    const result = resolveCombatAction({
      ...baseInput,
      action: "HEAL",
      canHeal: true,
      playerHp: 10,
      playerHpMax: 20,
    });
    expect(result.outcome).toBe("CONTINUE");
    expect(result.healIntent).toEqual({ requiresPotion: true, healAmount: 5 });
    expect(result.hpDelta).toBe(5);
  });

  it("HEAL with canHeal false does not heal", () => {
    const result = resolveCombatAction({
      ...baseInput,
      action: "HEAL",
      canHeal: false,
    });
    expect(result.outcome).toBe("CONTINUE");
    expect(result.healIntent).toBeUndefined();
    expect(result.hpDelta).toBe(0);
    expect(result.logEntry.text).toContain("No potion");
  });

  it("increments turnCounter by 1 for every action", () => {
    expect(resolveCombatAction({ ...baseInput, turnCounter: 0 }).nextTurnCounter).toBe(1);
    expect(resolveCombatAction({ ...baseInput, turnCounter: 5 }).nextTurnCounter).toBe(6);
    expect(
      resolveCombatAction({ ...baseInput, action: "RETREAT", turnCounter: 2 }).nextTurnCounter
    ).toBe(3);
  });

  it("ATTACK with enemy at 1 HP and damage >= 1 yields WIN (enemy defeated)", () => {
    const result = resolveCombatAction({
      ...baseInput,
      encounter: { ...baseEncounter, enemyHp: 1 },
      playerAttack: 5,
    });
    expect(result.outcome).toBe("WIN");
    expect(result.enemyHpAfter).toBe(0);
    expect(result.hpDelta).toBe(0);
  });

  it("ATTACK with enemyHp as number 0 or string/coerced still yields WIN when damage defeats", () => {
    const result = resolveCombatAction({
      ...baseInput,
      encounter: { ...baseEncounter, enemyHp: "1" as unknown as number },
      playerAttack: 5,
    });
    expect(result.outcome).toBe("WIN");
    expect(result.enemyHpAfter).toBe(0);
  });
});
