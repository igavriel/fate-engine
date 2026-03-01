import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/game/character/create/route";

const mockRequireAuth = vi.fn();
const mockParseJson = vi.fn();
const mockCreateCharacter = vi.fn();

vi.mock("@/server/auth/requireAuth", () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
}));
vi.mock("@/server/http/validate", () => ({
  parseJson: (req: Request, schema: unknown) => mockParseJson(req, schema),
}));
vi.mock("@/server/game/createCharacter", () => ({
  createCharacter: (userId: string, params: unknown) => mockCreateCharacter(userId, params),
}));

describe("POST /api/game/character/create", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockParseJson.mockReset();
    mockCreateCharacter.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockParseJson).not.toHaveBeenCalled();
  });

  it("returns 400 when body validation fails", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: false,
      error: { message: "name too short" },
    });
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "A", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when SLOT_NOT_FOUND", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, name: "Hero", species: "HUMAN" },
    });
    mockCreateCharacter.mockRejectedValue(new Error("SLOT_NOT_FOUND"));
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("Slot not found");
  });

  it("returns 400 when SLOT_OCCUPIED", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, name: "Hero", species: "HUMAN" },
    });
    mockCreateCharacter.mockRejectedValue(new Error("SLOT_OCCUPIED"));
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("already has a character");
  });

  it("returns 500 on other createCharacter errors", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, name: "Hero", species: "HUMAN" },
    });
    mockCreateCharacter.mockRejectedValue(new Error("DB_ERROR"));
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("Failed to create character");
  });

  it("returns 200 with result on success", async () => {
    mockRequireAuth.mockResolvedValue("user-1");
    mockParseJson.mockResolvedValue({
      success: true,
      data: { slotIndex: 1, name: "Hero", species: "HUMAN" },
    });
    mockCreateCharacter.mockResolvedValue({
      slotIndex: 1,
      characterId: "char-1",
      runId: "run-1",
    });
    const res = await POST(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "fe_auth=x" },
        body: JSON.stringify({ slotIndex: 1, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { slotIndex: number; characterId: string; runId: string };
    expect(data).toEqual({ slotIndex: 1, characterId: "char-1", runId: "run-1" });
  });
});
