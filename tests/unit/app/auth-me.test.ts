import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/auth/me/route";

const mockGetAuthCookie = vi.fn();
const mockVerifyToken = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/server/auth/cookies", () => ({
  getAuthCookie: (req: Request) => mockGetAuthCookie(req),
}));
vi.mock("@/server/auth/jwt", () => ({
  verifyToken: (token: string) => mockVerifyToken(token),
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockGetAuthCookie.mockReset();
    mockVerifyToken.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns 401 when no cookie", async () => {
    mockGetAuthCookie.mockReturnValue(null);
    const res = await GET(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it("returns 401 when token invalid", async () => {
    mockGetAuthCookie.mockReturnValue("bad-token");
    mockVerifyToken.mockReturnValue(null);
    const res = await GET(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when user not in DB", async () => {
    mockGetAuthCookie.mockReturnValue("token");
    mockVerifyToken.mockReturnValue({ sub: "user-1" });
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with user when authenticated", async () => {
    mockGetAuthCookie.mockReturnValue("token");
    mockVerifyToken.mockReturnValue({ sub: "user-1" });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "me@test.com",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const res = await GET(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: { id: string; email: string; createdAt: string } };
    expect(data.user).toEqual({
      id: "user-1",
      email: "me@test.com",
      createdAt: "2025-01-01T00:00:00.000Z",
    });
  });
});
