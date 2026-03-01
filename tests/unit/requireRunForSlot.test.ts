import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRunForSlot, GameError } from "@/server/game/requireRunForSlot";

const mockFindUnique = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    saveSlot: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

describe("requireRunForSlot", () => {
  const userId = "user-1";
  const slotIndex = 1;

  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("when slot missing → throws GameError SLOT_NOT_FOUND", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(requireRunForSlot(userId, slotIndex)).rejects.toThrow(GameError);
    await expect(requireRunForSlot(userId, slotIndex)).rejects.toMatchObject({
      code: "SLOT_NOT_FOUND",
      message: "Slot not found",
      status: 404,
    });
  });

  it("when slot empty (no characterId) → throws GameError SLOT_EMPTY", async () => {
    mockFindUnique.mockResolvedValue({
      id: "slot-1",
      userId,
      slotIndex,
      characterId: null,
      runId: "run-1",
      updatedAt: new Date(),
    });

    await expect(requireRunForSlot(userId, slotIndex)).rejects.toThrow(GameError);
    await expect(requireRunForSlot(userId, slotIndex)).rejects.toMatchObject({
      code: "SLOT_EMPTY",
      message: "Slot has no character or run",
      status: 400,
    });
  });

  it("when slot empty (no runId) → throws GameError SLOT_EMPTY", async () => {
    mockFindUnique.mockResolvedValue({
      id: "slot-1",
      userId,
      slotIndex,
      characterId: "char-1",
      runId: null,
      updatedAt: new Date(),
    });

    await expect(requireRunForSlot(userId, slotIndex)).rejects.toThrow(GameError);
    await expect(requireRunForSlot(userId, slotIndex)).rejects.toMatchObject({
      code: "SLOT_EMPTY",
      status: 400,
    });
  });

  it("when run or character missing in DB → throws GameError DATA_INCONSISTENT", async () => {
    mockFindUnique.mockResolvedValue({
      id: "slot-1",
      userId,
      slotIndex,
      characterId: "char-1",
      runId: "run-1",
      updatedAt: new Date(),
      run: null,
    });

    await expect(requireRunForSlot(userId, slotIndex)).rejects.toThrow(GameError);
    await expect(requireRunForSlot(userId, slotIndex)).rejects.toMatchObject({
      code: "DATA_INCONSISTENT",
      message: "Character or run missing for slot",
      status: 500,
    });
  });

  it("when valid → returns slot, character, run", async () => {
    const character = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const run = {
      id: "run-1",
      userId,
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
    const slot = {
      id: "slot-1",
      userId,
      slotIndex,
      characterId: "char-1",
      runId: "run-1",
      updatedAt: new Date(),
    };

    mockFindUnique.mockResolvedValue({
      ...slot,
      run,
    });

    const result = await requireRunForSlot(userId, slotIndex);

    expect(result.slot).toBeDefined();
    expect(result.slot.id).toBe("slot-1");
    expect(result.slot.characterId).toBe("char-1");
    expect(result.slot.runId).toBe("run-1");
    expect(result.character).toEqual(character);
    expect(result.run).toEqual(run);
    expect(result.run.character).toEqual(character);
  });
});
