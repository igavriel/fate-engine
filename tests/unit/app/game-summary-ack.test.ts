import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/summary/ack/route";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockAckSummary = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/combatService", () => ({
  ackSummary: (userId: string, slotIndex: number) => mockAckSummary(userId, slotIndex),
}));

describe("POST /api/game/summary/ack", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockAckSummary.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockParseJson).not.toHaveBeenCalled();
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: false, error: "slotIndex required" });
    const res = await POST(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with status and inventory on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1 },
    });
    mockAckSummary.mockResolvedValue({
      status: {
        slotIndex: 1,
        run: {
          id: "run-1",
          level: 1,
          hp: 20,
          hpMax: 20,
          coins: 0,
          status: "ACTIVE",
          isRecoverable: true,
        },
      },
      inventory: [],
    });
    const res = await POST(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: unknown; inventory: unknown[] };
    expect(data.status).toBeDefined();
    expect(Array.isArray(data.inventory)).toBe(true);
    expect(mockAckSummary).toHaveBeenCalledWith("user-1", 1);
  });

  it("returns 404 when GameError SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1 },
    });
    const { GameError } = await import("@/server/game/requireRunForSlot");
    mockAckSummary.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await POST(
      new Request("http://localhost/api/game/summary/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("SLOT_NOT_FOUND");
  });
});
