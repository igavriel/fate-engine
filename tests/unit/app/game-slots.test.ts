import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/slots/route";

const mockRequireAuth = vi.fn();
const mockListSlots = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/slots", () => ({
  listSlots: (userId: string) => mockListSlots(userId),
}));

describe("GET /api/game/slots", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockListSlots.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/game/slots"));
    expect(res.status).toBe(401);
    expect(mockListSlots).not.toHaveBeenCalled();
  });

  it("returns 200 with slots when authenticated", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockListSlots.mockResolvedValue({
      slots: [
        { slotIndex: 1, isEmpty: true, character: null, updatedAt: null },
        { slotIndex: 2, isEmpty: false, character: { id: "c2", name: "Hero", species: "HUMAN", level: 1 }, updatedAt: "2025-01-01T00:00:00.000Z" },
        { slotIndex: 3, isEmpty: true, character: null, updatedAt: null },
      ],
    });
    const res = await GET(
      new Request("http://localhost/api/game/slots", {
        headers: { Cookie: "fe_auth=token" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { slots: unknown[] };
    expect(data.slots).toHaveLength(3);
    expect(mockListSlots).toHaveBeenCalledWith("user-1");
  });
});
