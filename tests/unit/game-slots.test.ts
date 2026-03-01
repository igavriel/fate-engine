import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureUserSlots, listSlots } from "@/server/game/slots";

const mockFindMany = vi.fn();
const mockCreateMany = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    saveSlot: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
    },
  },
}));

describe("ensureUserSlots", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateMany.mockReset();
  });

  it("does nothing when user already has 3 slots", async () => {
    mockFindMany.mockResolvedValue([
      { slotIndex: 1 },
      { slotIndex: 2 },
      { slotIndex: 3 },
    ]);

    await ensureUserSlots("user-1");

    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("creates missing slots when user has none", async () => {
    mockFindMany.mockResolvedValue([]);

    await ensureUserSlots("user-1");

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: "user-1", slotIndex: 1 },
        { userId: "user-1", slotIndex: 2 },
        { userId: "user-1", slotIndex: 3 },
      ],
    });
  });

  it("creates only missing slot indexes", async () => {
    mockFindMany.mockResolvedValue([{ slotIndex: 1 }, { slotIndex: 3 }]);

    await ensureUserSlots("user-1");

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ userId: "user-1", slotIndex: 2 }],
    });
  });
});

describe("listSlots", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateMany.mockReset();
  });

  it("returns 3 slots with empty and character data", async () => {
    mockFindMany
      .mockResolvedValueOnce([{ slotIndex: 1 }, { slotIndex: 2 }, { slotIndex: 3 }])
      .mockResolvedValueOnce([
        {
          slotIndex: 1,
          characterId: null,
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          character: null,
        },
        {
          slotIndex: 2,
          characterId: "char-2",
          updatedAt: new Date("2025-01-02T00:00:00.000Z"),
          character: {
            id: "char-2",
            name: "Hero",
            species: "HUMAN",
            level: 3,
          },
        },
        {
          slotIndex: 3,
          characterId: null,
          updatedAt: new Date("2025-01-03T00:00:00.000Z"),
          character: null,
        },
      ]);

    const result = await listSlots("user-1");

    expect(result.slots).toHaveLength(3);
    expect(result.slots[0]).toMatchObject({
      slotIndex: 1,
      isEmpty: true,
      character: null,
    });
    expect(result.slots[1]).toMatchObject({
      slotIndex: 2,
      isEmpty: false,
      character: { id: "char-2", name: "Hero", species: "HUMAN", level: 3 },
    });
    expect(result.slots[2].isEmpty).toBe(true);
  });

  it("returns character null when row has characterId but character include is null", async () => {
    mockFindMany
      .mockResolvedValueOnce([{ slotIndex: 1 }, { slotIndex: 2 }, { slotIndex: 3 }])
      .mockResolvedValueOnce([
        {
          slotIndex: 1,
          characterId: "char-1",
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          character: null,
        },
        {
          slotIndex: 2,
          characterId: null,
          updatedAt: new Date("2025-01-02T00:00:00.000Z"),
          character: null,
        },
        {
          slotIndex: 3,
          characterId: null,
          updatedAt: new Date("2025-01-03T00:00:00.000Z"),
          character: null,
        },
      ]);

    const result = await listSlots("user-1");

    expect(result.slots[0].isEmpty).toBe(false);
    expect(result.slots[0].character).toBeNull();
  });

  it("returns empty slot with updatedAt null when row missing for slot index", async () => {
    mockFindMany
      .mockResolvedValueOnce([{ slotIndex: 1 }, { slotIndex: 2 }, { slotIndex: 3 }])
      .mockResolvedValueOnce([
        {
          slotIndex: 1,
          characterId: null,
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          character: null,
        },
        {
          slotIndex: 3,
          characterId: null,
          updatedAt: new Date("2025-01-03T00:00:00.000Z"),
          character: null,
        },
      ]);

    const result = await listSlots("user-1");

    expect(result.slots).toHaveLength(3);
    expect(result.slots[1]).toEqual({
      slotIndex: 2,
      isEmpty: true,
      character: null,
      updatedAt: null,
    });
  });
});
