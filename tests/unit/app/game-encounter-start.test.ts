import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/encounter/start/route";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockStartEncounter = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/combatService", () => ({
  startEncounter: (userId: string, slotIndex: number, choiceId: string) =>
    mockStartEncounter(userId, slotIndex, choiceId),
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

describe("POST /api/game/encounter/start", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockStartEncounter.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, choiceId: "enemy-1-0-0" }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockParseJson).not.toHaveBeenCalled();
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: false, error: "choiceId required" });
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with encounterId on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, choiceId: "enemy-42-0-1" },
    });
    mockStartEncounter.mockResolvedValue({ encounterId: "uuid-enc-1" });
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, choiceId: "enemy-42-0-1" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { encounterId: string };
    expect(data.encounterId).toBe("uuid-enc-1");
    expect(mockStartEncounter).toHaveBeenCalledWith("user-1", 1, "enemy-42-0-1");
  });

  it("returns 409 when CombatError SUMMARY_PENDING", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, choiceId: "enemy-1-0-0" },
    });
    const { CombatError } = await import("@/server/game/combatService");
    mockStartEncounter.mockRejectedValue(
      new CombatError("SUMMARY_PENDING", "Acknowledge first", 409)
    );
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, choiceId: "enemy-1-0-0" }),
      })
    );
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("SUMMARY_PENDING");
    expect(data.error.message).toBeDefined();
  });

  it("returns 409 when CombatError ENCOUNTER_ACTIVE", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, choiceId: "enemy-1-0-0" },
    });
    const { CombatError } = await import("@/server/game/combatService");
    mockStartEncounter.mockRejectedValue(
      new CombatError("ENCOUNTER_ACTIVE", "An encounter is already active", 409)
    );
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, choiceId: "enemy-1-0-0" }),
      })
    );
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("ENCOUNTER_ACTIVE");
  });

  it("returns 404 when GameError SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, choiceId: "enemy-1-0-0" },
    });
    const { GameError } = await import("@/server/game/requireRunForSlot");
    mockStartEncounter.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await POST(
      new Request("http://localhost/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, choiceId: "enemy-1-0-0" }),
      })
    );
    expect(res.status).toBe(404);
  });
});
