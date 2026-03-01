import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/inventory/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockGetGameStatus = vi.fn();
const mockGetInventory = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/status", () => ({
  getGameStatus: (userId: string, slotIndex: number) => mockGetGameStatus(userId, slotIndex),
}));
vi.mock("@/server/game/inventoryService", () => ({
  getInventory: (userId: string, slotIndex: number) => mockGetInventory(userId, slotIndex),
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
const sampleInventory: {
  id: string;
  runId: string;
  itemCatalogId: string;
  quantity: number;
  catalog: object;
}[] = [];

describe("GET /api/game/inventory", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockGetGameStatus.mockReset();
    mockGetInventory.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/game/inventory?slotIndex=1"));
    expect(res.status).toBe(401);
    expect(mockGetGameStatus).not.toHaveBeenCalled();
    expect(mockGetInventory).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex invalid", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/inventory?slotIndex=99", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    expect(mockGetGameStatus).not.toHaveBeenCalled();
    expect(mockGetInventory).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex missing", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/inventory", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns GameError status when service throws GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockRejectedValue(new GameError("SLOT_EMPTY", "Slot has no character", 400));
    const res = await GET(
      new Request("http://localhost/api/game/inventory?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("SLOT_EMPTY");
  });

  it("returns 500 when service throws non-GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await GET(
      new Request("http://localhost/api/game/inventory?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(500);
  });

  it("returns 200 with status and inventory on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockResolvedValue(sampleStatus);
    mockGetInventory.mockResolvedValue(sampleInventory);
    const res = await GET(
      new Request("http://localhost/api/game/inventory?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: typeof sampleStatus; inventory: unknown[] };
    expect(data.status).toEqual(sampleStatus);
    expect(data.inventory).toEqual(sampleInventory);
    expect(mockGetGameStatus).toHaveBeenCalledWith("user-1", 1);
    expect(mockGetInventory).toHaveBeenCalledWith("user-1", 1);
  });
});
