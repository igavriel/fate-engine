import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCharacter } from "@/server/game/createCharacter";

const mockFindUnique = vi.fn();
const mockCharacterCreate = vi.fn();
const mockRunCreate = vi.fn();
const mockCharacterStatsCreate = vi.fn();
const mockRunEquipmentCreate = vi.fn();
const mockSaveSlotUpdate = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    saveSlot: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockSaveSlotUpdate(...args),
    },
    character: {
      create: (...args: unknown[]) => mockCharacterCreate(...args),
    },
    run: {
      create: (...args: unknown[]) => mockRunCreate(...args),
    },
    characterStats: {
      create: (...args: unknown[]) => mockCharacterStatsCreate(...args),
    },
    runEquipment: {
      create: (...args: unknown[]) => mockRunEquipmentCreate(...args),
    },
  },
}));

describe("createCharacter", () => {
  const userId = "user-1";
  const slotId = "slot-1";

  beforeEach(() => {
    mockFindUnique.mockReset();
    mockCharacterCreate.mockReset();
    mockRunCreate.mockReset();
    mockCharacterStatsCreate.mockReset();
    mockRunEquipmentCreate.mockReset();
    mockSaveSlotUpdate.mockReset();
  });

  it("throws SLOT_NOT_FOUND when slot does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      createCharacter(userId, { slotIndex: 1, name: "Hero", species: "HUMAN" })
    ).rejects.toThrow("SLOT_NOT_FOUND");
    expect(mockCharacterCreate).not.toHaveBeenCalled();
  });

  it("throws SLOT_OCCUPIED when slot already has character", async () => {
    mockFindUnique.mockResolvedValue({
      id: slotId,
      userId,
      slotIndex: 1,
      characterId: "existing-char",
      runId: "run-1",
    });

    await expect(
      createCharacter(userId, { slotIndex: 1, name: "Hero", species: "HUMAN" })
    ).rejects.toThrow("SLOT_OCCUPIED");
    expect(mockCharacterCreate).not.toHaveBeenCalled();
  });

  it("creates character, run, stats, equipment and updates slot on success", async () => {
    mockFindUnique.mockResolvedValue({
      id: slotId,
      userId,
      slotIndex: 1,
      characterId: null,
      runId: null,
    });
    const createdChar = {
      id: "char-1",
      userId,
      name: "Hero",
      species: "HUMAN",
      level: 1,
      xp: 0,
      baseAttack: 5,
      baseDefense: 5,
      baseLuck: 5,
      baseHpMax: 20,
    };
    mockCharacterCreate.mockResolvedValue(createdChar);
    mockRunCreate.mockResolvedValue({
      id: "run-1",
      userId,
      characterId: "char-1",
      seed: 12345,
      fightCounter: 0,
      turnCounter: 0,
      hp: 20,
      coins: 0,
      lastOutcome: "NONE",
    });

    const result = await createCharacter(userId, {
      slotIndex: 1,
      name: "  Hero  ",
      species: "HUMAN",
    });

    expect(result).toEqual({
      slotIndex: 1,
      characterId: "char-1",
      runId: "run-1",
    });
    expect(mockCharacterCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        name: "Hero",
        species: "HUMAN",
        level: 1,
        xp: 0,
      }),
    });
    expect(mockRunCreate).toHaveBeenCalled();
    expect(mockCharacterStatsCreate).toHaveBeenCalledWith({
      data: { characterId: "char-1" },
    });
    expect(mockRunEquipmentCreate).toHaveBeenCalledWith({
      data: { runId: "run-1" },
    });
    expect(mockSaveSlotUpdate).toHaveBeenCalledWith({
      where: { id: slotId },
      data: { characterId: "char-1", runId: "run-1" },
    });
  });
});
