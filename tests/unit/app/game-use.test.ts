import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/use/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockUsePotionItem = vi.fn();
const mockGetGameStatus = vi.fn();
const mockGetInventory = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/inventoryService", () => ({
  usePotionItem: (
    userId: string,
    slotIndex: number,
    inventoryItemId: string
  ) => mockUsePotionItem(userId, slotIndex, inventoryItemId),
  getInventory: (userId: string, slotIndex: number) =>
    (mockGetInventory as vi.Mock)(userId, slotIndex),
}));
vi.mock("@/server/game/status", () => ({
  getGameStatus: (userId: string, slotIndex: number) =>
    mockGetGameStatus(userId, slotIndex),
}));

const sampleStatus = {
  slotIndex: 1,
  run: {
    id: "run-1",
    seed: 42,
    level: 1,
    xp: 0,
    hp: 20,
    hpMax: 20,
    coins: 0,
    baseStats: { attack: 5, defense: 5, luck: 5, hpMax: 20 },
    effectiveStats: { attack: 5, defense: 5, luck: 5, hpMax: 20 },
    equipped: { weapon: null, armor: null },
    lastOutcome: "NONE",
  },
};
const sampleInventory: unknown[] = [];

describe("POST /api/game/use", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockUsePotionItem.mockReset();
    mockGetGameStatus.mockReset();
    mockGetInventory.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: false, error: "Invalid body" });
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns GameError status when usePotionItem throws GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: {
        slotIndex: 1,
        inventoryItemId: "00000000-0000-0000-0000-000000000001",
      },
    });
    mockUsePotionItem.mockRejectedValue(
      new GameError("SLOT_EMPTY", "Slot empty", 400)
    );
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SLOT_EMPTY");
  });

  it("returns 404 when ITEM_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: {
        slotIndex: 1,
        inventoryItemId: "00000000-0000-0000-0000-000000000001",
      },
    });
    mockUsePotionItem.mockRejectedValue(new Error("ITEM_NOT_FOUND"));
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("Item not found");
  });

  it("returns 400 when NOT_A_POTION", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: {
        slotIndex: 1,
        inventoryItemId: "00000000-0000-0000-0000-000000000001",
      },
    });
    mockUsePotionItem.mockRejectedValue(new Error("NOT_A_POTION"));
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("not a potion");
  });

  it("returns 500 on other errors", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: {
        slotIndex: 1,
        inventoryItemId: "00000000-0000-0000-0000-000000000001",
      },
    });
    mockUsePotionItem.mockRejectedValue(new Error("DB_ERROR"));
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(500);
  });

  it("returns 200 with status and inventory on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: {
        slotIndex: 1,
        inventoryItemId: "00000000-0000-0000-0000-000000000001",
      },
    });
    mockUsePotionItem.mockResolvedValue(undefined);
    mockGetGameStatus.mockResolvedValue(sampleStatus);
    mockGetInventory.mockResolvedValue(sampleInventory);
    const res = await POST(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({
          slotIndex: 1,
          inventoryItemId: "00000000-0000-0000-0000-000000000001",
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: typeof sampleStatus; inventory: unknown[] };
    expect(data.status).toEqual(sampleStatus);
    expect(data.inventory).toEqual(sampleInventory);
    expect(mockUsePotionItem).toHaveBeenCalledWith(
      "user-1",
      1,
      "00000000-0000-0000-0000-000000000001"
    );
  });
});
