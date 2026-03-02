import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGameStatus } from "@/server/game/status";

const mockRequireRunForSlot = vi.fn();
const mockRunEquipmentFindUnique = vi.fn();
const mockRunInventoryItemFindMany = vi.fn();

vi.mock("@/server/game/requireRunForSlot", () => ({
  requireRunForSlot: (...args: unknown[]) => mockRequireRunForSlot(...args),
}));

const mockRunUpdate = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    run: {
      update: (...args: unknown[]) => mockRunUpdate(...args),
    },
    runEquipment: {
      findUnique: (...args: unknown[]) => mockRunEquipmentFindUnique(...args),
    },
    runInventoryItem: {
      findMany: (...args: unknown[]) => mockRunInventoryItemFindMany(...args),
    },
  },
}));

describe("getGameStatus", () => {
  beforeEach(() => {
    mockRequireRunForSlot.mockReset();
    mockRunEquipmentFindUnique.mockReset();
    mockRunInventoryItemFindMany.mockReset();
    mockRunUpdate.mockReset();
    mockRunInventoryItemFindMany.mockResolvedValue([]);
    mockRunEquipmentFindUnique.mockResolvedValue({
      runId: "run-1",
      weaponInventoryItemId: null,
      armorInventoryItemId: null,
    });
    mockRunUpdate.mockResolvedValue(undefined);
  });

  it("returns game status with run and base stats", async () => {
    const character = {
      id: "char-1",
      userId: "user-1",
      name: "Hero",
      species: "HUMAN",
      level: 2,
      xp: 10,
      baseAttack: 6,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId: "user-1",
      characterId: "char-1",
      seed: 42,
      fightCounter: 0,
      turnCounter: 0,
      hp: 18,
      coins: 5,
      lastOutcome: "NONE",
      status: "ACTIVE" as const,
      stateJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      character,
    };
    mockRequireRunForSlot.mockResolvedValue({ character, run });

    const result = await getGameStatus("user-1", 1);

    expect(result.slotIndex).toBe(1);
    expect(result.run.id).toBe("run-1");
    expect(result.run.seed).toBe(42);
    expect(result.run.level).toBe(2);
    expect(result.run.xp).toBe(10);
    expect(result.run.hp).toBe(18);
    expect(result.run.hpMax).toBe(20);
    expect(result.run.coins).toBe(5);
    expect(result.run.baseStats).toEqual({
      attack: 6,
      defense: 5,
      luck: 5,
      hpMax: 20,
    });
    expect(result.run.effectiveStats).toEqual(result.run.baseStats);
    expect(result.run.equipped).toEqual({ weapon: null, armor: null });
    expect(result.run.lastOutcome).toBe("NONE");
    expect(result.run.status).toBe("ACTIVE");
    expect(result.run.isRecoverable).toBe(true); // hp 18 > 0
  });

  it("sets isRecoverable with hasPotion when hp > 0", async () => {
    const character = {
      id: "char-1",
      userId: "user-1",
      name: "Hero",
      species: "HUMAN",
      level: 1,
      xp: 0,
      baseAttack: 5,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId: "user-1",
      characterId: "char-1",
      seed: 42,
      fightCounter: 0,
      turnCounter: 0,
      hp: 5,
      coins: 0,
      lastOutcome: "NONE",
      status: "ACTIVE" as const,
      stateJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      character,
    };
    mockRequireRunForSlot.mockResolvedValue({ character, run });
    mockRunInventoryItemFindMany.mockResolvedValue([
      { itemCatalog: { itemType: "POTION" }, quantity: 1 },
    ]);

    const result = await getGameStatus("user-1", 1);

    expect(result.run.isRecoverable).toBe(true);
    expect(result.run.hp).toBe(5);
  });

  it("returns effectiveStats with weapon and armor bonuses when equipped", async () => {
    const character = {
      id: "char-1",
      userId: "user-1",
      name: "Hero",
      species: "HUMAN",
      level: 1,
      xp: 0,
      baseAttack: 5,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId: "user-1",
      characterId: "char-1",
      seed: 42,
      fightCounter: 0,
      turnCounter: 0,
      hp: 20,
      coins: 0,
      lastOutcome: "NONE",
      status: "ACTIVE" as const,
      stateJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      character,
    };
    mockRequireRunForSlot.mockResolvedValue({ character, run });
    mockRunEquipmentFindUnique.mockResolvedValue({
      runId: "run-1",
      weaponInventoryItemId: "w1",
      armorInventoryItemId: "a1",
      weaponInventoryItem: { itemCatalog: { attackBonus: 2 } },
      armorInventoryItem: { itemCatalog: { defenseBonus: 1 } },
    });

    const result = await getGameStatus("user-1", 1);

    expect(result.run.baseStats.attack).toBe(5);
    expect(result.run.effectiveStats.attack).toBe(7);
    expect(result.run.baseStats.defense).toBe(5);
    expect(result.run.effectiveStats.defense).toBe(6);
    expect(result.run.equipped).toEqual({ weapon: "w1", armor: "a1" });
  });

  it("returns status OVER and isRecoverable false when run is over and no potion", async () => {
    const character = {
      id: "char-1",
      userId: "user-1",
      name: "Hero",
      species: "HUMAN",
      level: 1,
      xp: 0,
      baseAttack: 5,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId: "user-1",
      characterId: "char-1",
      seed: 42,
      fightCounter: 0,
      turnCounter: 0,
      hp: 0,
      coins: 10,
      lastOutcome: "DEFEAT",
      status: "OVER" as const,
      stateJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      character,
    };
    mockRequireRunForSlot.mockResolvedValue({ character, run });

    const result = await getGameStatus("user-1", 1);

    expect(result.run.status).toBe("OVER");
    expect(result.run.isRecoverable).toBe(false);
  });
});

describe("endRun", () => {
  beforeEach(() => {
    mockRequireRunForSlot.mockReset();
    mockRunEquipmentFindUnique.mockReset();
    mockRunInventoryItemFindMany.mockReset();
    mockRunUpdate.mockReset();
    mockRunInventoryItemFindMany.mockResolvedValue([]);
    mockRunEquipmentFindUnique.mockResolvedValue({
      runId: "run-1",
      weaponInventoryItemId: null,
      armorInventoryItemId: null,
    });
    mockRunUpdate.mockResolvedValue(undefined);
  });

  it("updates run status to OVER and returns getGameStatus", async () => {
    const character = {
      id: "char-1",
      userId: "user-1",
      name: "Hero",
      species: "HUMAN",
      level: 1,
      xp: 0,
      baseAttack: 5,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId: "user-1",
      characterId: "char-1",
      seed: 42,
      fightCounter: 0,
      turnCounter: 0,
      hp: 20,
      coins: 0,
      lastOutcome: "NONE",
      status: "ACTIVE" as const,
      stateJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      character,
    };
    mockRequireRunForSlot.mockResolvedValue({ character, run });

    const { endRun } = await import("@/server/game/status");
    const result = await endRun("user-1", 1);

    expect(mockRunUpdate).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: { status: "OVER" },
    });
    expect(result.slotIndex).toBe(1);
    expect(result.run.id).toBe("run-1");
    expect(result.run.status).toBe("ACTIVE"); // still ACTIVE from mock; real impl would re-fetch
  });
});
