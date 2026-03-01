import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/slots/delete/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockDeleteSlot = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/deleteSlot", () => ({
  deleteSlot: (userId: string, slotIndex: number) => mockDeleteSlot(userId, slotIndex),
}));

describe("POST /api/game/slots/delete", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockDeleteSlot.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/slots/delete", {
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
    mockParseJson.mockResolvedValue({
      success: false,
      error: { message: "slotIndex invalid" },
    });
    const res = await POST(
      new Request("http://localhost/api/game/slots/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 99 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1 },
    });
    mockDeleteSlot.mockRejectedValue(new GameError("SLOT_NOT_FOUND", "Slot not found", 404));
    const res = await POST(
      new Request("http://localhost/api/game/slots/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toBe("Slot not found");
  });

  it("returns 400 when SLOT_EMPTY", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 2 },
    });
    mockDeleteSlot.mockRejectedValue(
      new GameError("SLOT_EMPTY", "Slot has no character to delete", 400)
    );
    const res = await POST(
      new Request("http://localhost/api/game/slots/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 2 }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("no character");
  });

  it("returns 200 with slots when delete succeeds", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1 },
    });
    const slotsResponse = {
      slots: [
        { slotIndex: 1, isEmpty: true, character: null, updatedAt: null },
        {
          slotIndex: 2,
          isEmpty: false,
          character: { id: "c2", name: "Hero", species: "HUMAN", level: 1 },
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        { slotIndex: 3, isEmpty: true, character: null, updatedAt: null },
      ],
    };
    mockDeleteSlot.mockResolvedValue(slotsResponse);
    const res = await POST(
      new Request("http://localhost/api/game/slots/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1 }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockDeleteSlot).toHaveBeenCalledWith("user-1", 1);
    const data = (await res.json()) as { slots: unknown[] };
    expect(data.slots).toHaveLength(3);
    expect(data.slots[0]).toMatchObject({ slotIndex: 1, isEmpty: true });
  });
});
