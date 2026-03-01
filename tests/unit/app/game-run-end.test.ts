import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/run/end/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockEndRun = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/status", () => ({
  endRun: (userId: string, slotIndex: number) => mockEndRun(userId, slotIndex),
}));

function authHeaders() {
  return { "Content-Type": "application/json", Cookie: "fe_auth=token" };
}

describe("POST /api/game/run/end", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockEndRun.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/run/end", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockEndRun).not.toHaveBeenCalled();
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: false, error: "slotIndex required" });
    const res = await POST(
      new Request("http://localhost/api/game/run/end", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
    expect(mockEndRun).not.toHaveBeenCalled();
  });

  it("returns 200 with status when run is ended", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: true, data: { slotIndex: 1 } });
    mockEndRun.mockResolvedValue({
      slotIndex: 1,
      run: {
        id: "run-1",
        seed: 42,
        level: 1,
        hp: 20,
        hpMax: 20,
        coins: 0,
        status: "OVER",
        isRecoverable: true,
      },
    });
    const res = await POST(
      new Request("http://localhost/api/game/run/end", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: { run: { status: string } } };
    expect(data.status).toBeDefined();
    expect(data.status.run.status).toBe("OVER");
    expect(mockEndRun).toHaveBeenCalledWith("user-1", 1);
  });

  it("returns GameError status when endRun throws GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({ success: true, data: { slotIndex: 1 } });
    mockEndRun.mockRejectedValue(new GameError("SLOT_EMPTY", "Slot has no character or run", 400));
    const res = await POST(
      new Request("http://localhost/api/game/run/end", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SLOT_EMPTY");
  });
});
