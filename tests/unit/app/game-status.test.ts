import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/status/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockGetGameStatus = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/status", () => ({
  getGameStatus: (userId: string, slotIndex: number) => mockGetGameStatus(userId, slotIndex),
}));

describe("GET /api/game/status", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockGetGameStatus.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/game/status?slotIndex=1"));
    expect(res.status).toBe(401);
    expect(mockGetGameStatus).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex invalid", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/status?slotIndex=99", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    expect(mockGetGameStatus).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex missing", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/status", { headers: { Cookie: "fe_auth=x" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns GameError status when getGameStatus throws GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await GET(
      new Request("http://localhost/api/game/status?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("SLOT_NOT_FOUND");
    expect(data.error.message).toBe("Slot not found");
  });

  it("returns 500 when getGameStatus throws non-GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await GET(
      new Request("http://localhost/api/game/status?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(500);
  });

  it("returns 200 with status on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetGameStatus.mockResolvedValue({
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
    });
    const res = await GET(
      new Request("http://localhost/api/game/status?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { slotIndex: number; run: { id: string } };
    expect(data.slotIndex).toBe(1);
    expect(data.run.id).toBe("run-1");
    expect(mockGetGameStatus).toHaveBeenCalledWith("user-1", 1);
  });
});
