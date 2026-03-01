import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGameStatus } from "@/server/game/status";

const mockRequireRunForSlot = vi.fn();
const mockRunEquipmentFindUnique = vi.fn();
const mockRunInventoryItemFindMany = vi.fn();

vi.mock("@/server/game/requireRunForSlot", () => ({
  requireRunForSlot: (...args: unknown[]) => mockRequireRunForSlot(...args),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
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
    mockRunInventoryItemFindMany.mockResolvedValue([]);
    mockRunEquipmentFindUnique.mockResolvedValue({
      runId: "run-1",
      weaponInventoryItemId: null,
      armorInventoryItemId: null,
    });
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
});
