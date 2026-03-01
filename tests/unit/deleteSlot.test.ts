import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteSlot } from "@/server/game/deleteSlot";
import { GameError } from "@/server/game/requireRunForSlot";

const mockFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockListSlots = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    saveSlot: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

vi.mock("@/server/game/slots", () => ({
  listSlots: (userId: string) => mockListSlots(userId),
}));

describe("deleteSlot", () => {
  const userId = "user-1";
  const slotId = "slot-1";
  const characterId = "char-1";
  const runId = "run-1";

  beforeEach(() => {
    mockFindUnique.mockReset();
    mockTransaction.mockReset();
    mockListSlots.mockReset();
  });

  it("throws SLOT_NOT_FOUND when slot does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(deleteSlot(userId, 1)).rejects.toThrow(GameError);
    await expect(deleteSlot(userId, 1)).rejects.toMatchObject({
      code: "SLOT_NOT_FOUND",
      status: 404,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("throws SLOT_EMPTY when slot has no character", async () => {
    mockFindUnique.mockResolvedValue({
      id: slotId,
      userId,
      slotIndex: 1,
      characterId: null,
      runId: null,
    });

    await expect(deleteSlot(userId, 1)).rejects.toThrow(GameError);
    await expect(deleteSlot(userId, 1)).rejects.toMatchObject({
      code: "SLOT_EMPTY",
      status: 400,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("clears slot and deletes run and character on success", async () => {
    mockFindUnique.mockResolvedValue({
      id: slotId,
      userId,
      slotIndex: 1,
      characterId,
      runId,
    });
    const mockSaveSlotUpdate = vi.fn().mockResolvedValue(undefined);
    const mockRunDelete = vi.fn().mockResolvedValue(undefined);
    const mockCharacterDelete = vi.fn().mockResolvedValue(undefined);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        saveSlot: { update: mockSaveSlotUpdate },
        run: { delete: mockRunDelete },
        character: { delete: mockCharacterDelete },
      };
      return fn(tx);
    });
    const slotsResponse = {
      slots: [
        { slotIndex: 1, isEmpty: true, character: null, updatedAt: null },
        { slotIndex: 2, isEmpty: false, character: { id: "c2", name: "Hero", species: "HUMAN", level: 1 }, updatedAt: "2025-01-01T00:00:00.000Z" },
        { slotIndex: 3, isEmpty: true, character: null, updatedAt: null },
      ],
    };
    mockListSlots.mockResolvedValue(slotsResponse);

    const result = await deleteSlot(userId, 1);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId_slotIndex: { userId, slotIndex: 1 } },
    });
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockSaveSlotUpdate).toHaveBeenCalledWith({
      where: { id: slotId },
      data: { characterId: null, runId: null },
    });
    expect(mockRunDelete).toHaveBeenCalledWith({ where: { id: runId } });
    expect(mockCharacterDelete).toHaveBeenCalledWith({ where: { id: characterId } });
    expect(mockListSlots).toHaveBeenCalledWith(userId);
    expect(result).toEqual(slotsResponse);
  });
});
