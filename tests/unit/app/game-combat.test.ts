import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/combat/route";

const mockRequireAuth = vi.fn();
const mockGetCombat = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/combatService", () => ({
  getCombat: (userId: string, slotIndex: number) => mockGetCombat(userId, slotIndex),
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

describe("GET /api/game/combat", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockGetCombat.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(401);
    expect(mockGetCombat).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex query is invalid", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/combat", { headers: { Cookie: "fe_auth=x" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with combat state on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetCombat.mockResolvedValue({
      slotIndex: 1,
      encounterId: "enc-1",
      player: { hp: 20, hpMax: 20, effectiveAttack: 7, effectiveDefense: 5, luck: 5 },
      enemy: { name: "Goblin", species: "Beast", level: 1, hp: 8, hpMax: 10 },
      log: [],
      canHeal: true,
    });
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { encounterId: string; enemy: { name: string } };
    expect(data.encounterId).toBe("enc-1");
    expect(data.enemy.name).toBe("Goblin");
    expect(mockGetCombat).toHaveBeenCalledWith("user-1", 1);
  });

  it("returns 404 when CombatError NO_ACTIVE_ENCOUNTER", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const { CombatError } = await import("@/server/game/combatService");
    mockGetCombat.mockRejectedValue(
      new CombatError("NO_ACTIVE_ENCOUNTER", "No active encounter", 404)
    );
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("NO_ACTIVE_ENCOUNTER");
  });

  it("returns 404 when GameError SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const { GameError } = await import("@/server/game/requireRunForSlot");
    mockGetCombat.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
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
    mockGetCombat.mockRejectedValue(
      new GameError("SLOT_EMPTY", "Slot has no character or run", 400)
    );
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SLOT_EMPTY");
  });

  it("rethrows non-CombatError/GameError (withRequestLogging returns 500)", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetCombat.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await GET(
      new Request("http://localhost/api/game/combat?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
