import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/summary/route";

const mockRequireAuth = vi.fn();
const mockGetSummary = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/combatService", () => ({
  getSummary: (userId: string, slotIndex: number) => mockGetSummary(userId, slotIndex),
  CombatError: class CombatError extends Error {
    constructor(
      public code: string,
      message: string,
      public status: 400 | 404
    ) {
      super(message);
      this.name = "CombatError";
    }
  },
}));

describe("GET /api/game/summary", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockGetSummary.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(401);
    expect(mockGetSummary).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex query is invalid", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/summary", { headers: { Cookie: "fe_auth=x" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with summary on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetSummary.mockResolvedValue({
      slotIndex: 1,
      outcome: "WIN",
      enemy: { name: "Goblin", species: "Beast", level: 1 },
      delta: { xpGained: 10, coinsGained: 5, hpChange: 0 },
      loot: [],
      leveledUp: false,
    });
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { outcome: string; enemy: { name: string } };
    expect(data.outcome).toBe("WIN");
    expect(data.enemy.name).toBe("Goblin");
    expect(mockGetSummary).toHaveBeenCalledWith("user-1", 1);
  });

  it("returns 404 when CombatError NO_SUMMARY", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const { CombatError } = await import("@/server/game/combatService");
    mockGetSummary.mockRejectedValue(new CombatError("NO_SUMMARY", "No pending summary", 404));
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("NO_SUMMARY");
  });

  it("returns 404 when GameError SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const { GameError } = await import("@/server/game/requireRunForSlot");
    mockGetSummary.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SLOT_NOT_FOUND");
  });

  it("returns 400 when GameError SLOT_EMPTY", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const { GameError } = await import("@/server/game/requireRunForSlot");
    mockGetSummary.mockRejectedValue(
      new GameError("SLOT_EMPTY", "Slot has no character or run", 400)
    );
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SLOT_EMPTY");
  });

  it("rethrows non-CombatError/GameError (withRequestLogging returns 500)", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetSummary.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await GET(
      new Request("http://localhost/api/game/summary?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
