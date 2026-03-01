import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/enemies/route";
import { GameError } from "@/server/game/requireRunForSlot";

const mockRequireAuth = vi.fn();
const mockGetEnemies = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/game/enemies", () => ({
  getEnemies: (userId: string, slotIndex: number) => mockGetEnemies(userId, slotIndex),
}));

describe("GET /api/game/enemies", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockGetEnemies.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/game/enemies?slotIndex=1"));
    expect(res.status).toBe(401);
    expect(mockGetEnemies).not.toHaveBeenCalled();
  });

  it("returns 400 when slotIndex invalid", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    const res = await GET(
      new Request("http://localhost/api/game/enemies?slotIndex=0", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns GameError status when getEnemies throws GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetEnemies.mockRejectedValue(new GameError("SLOT_EMPTY", "Slot has no character", 400));
    const res = await GET(
      new Request("http://localhost/api/game/enemies?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("SLOT_EMPTY");
  });

  it("returns 500 when getEnemies throws non-GameError", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetEnemies.mockRejectedValue(new Error("Unexpected error"));
    const res = await GET(
      new Request("http://localhost/api/game/enemies?slotIndex=1", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(500);
  });

  it("returns 200 with enemies on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockGetEnemies.mockResolvedValue({
      enemies: [
        {
          choiceId: "a",
          tier: "WEAK",
          name: "Goblin",
          species: "goblin",
          level: 1,
          preview: { estimatedLootCoinsMin: 0, estimatedLootCoinsMax: 5 },
        },
        {
          choiceId: "b",
          tier: "NORMAL",
          name: "Orc",
          species: "orc",
          level: 2,
          preview: { estimatedLootCoinsMin: 2, estimatedLootCoinsMax: 8 },
        },
        {
          choiceId: "c",
          tier: "TOUGH",
          name: "Troll",
          species: "troll",
          level: 3,
          preview: { estimatedLootCoinsMin: 5, estimatedLootCoinsMax: 15 },
        },
      ],
    });
    const res = await GET(
      new Request("http://localhost/api/game/enemies?slotIndex=2", {
        headers: { Cookie: "fe_auth=x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { enemies: unknown[] };
    expect(data.enemies).toHaveLength(3);
    expect(mockGetEnemies).toHaveBeenCalledWith("user-1", 2);
  });
});
