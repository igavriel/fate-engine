import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/action/route";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockApplyAction = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/combatService", () => ({
  applyAction: (userId: string, slotIndex: number, type: string) =>
    mockApplyAction(userId, slotIndex, type),
  CombatError: class CombatError extends Error {
    constructor(
      public code: string,
      message: string,
      public status: 400 | 404 | 409
    ) {
      super(message);
      this.name = "CombatError";
    }
  },
}));

describe("POST /api/game/action", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockApplyAction.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: false, error: "type invalid" });
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with outcome on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, type: "ATTACK" },
    });
    mockApplyAction.mockResolvedValue({ outcome: "CONTINUE" });
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { outcome: string };
    expect(data.outcome).toBe("CONTINUE");
    expect(mockApplyAction).toHaveBeenCalledWith("user-1", 1, "ATTACK");
  });

  it("returns 404 when CombatError NO_ACTIVE_ENCOUNTER", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, type: "ATTACK" },
    });
    const { CombatError } = await import("@/server/game/combatService");
    mockApplyAction.mockRejectedValue(new CombatError("NO_ACTIVE_ENCOUNTER", "No encounter", 404));
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("NO_ACTIVE_ENCOUNTER");
  });

  it("returns 409 when CombatError SUMMARY_PENDING", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, type: "ATTACK" },
    });
    const { CombatError } = await import("@/server/game/combatService");
    mockApplyAction.mockRejectedValue(
      new CombatError("SUMMARY_PENDING", "Acknowledge summary first", 409)
    );
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SUMMARY_PENDING");
  });

  it("returns 409 when CombatError RUN_OVER", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, type: "ATTACK" },
    });
    const { CombatError } = await import("@/server/game/combatService");
    mockApplyAction.mockRejectedValue(new CombatError("RUN_OVER", "Run has ended", 409));
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("RUN_OVER");
  });

  it("returns 500 when applyAction throws non-CombatError non-GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, type: "ATTACK" },
    });
    mockApplyAction.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await POST(
      new Request("http://localhost/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, type: "ATTACK" }),
      })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
