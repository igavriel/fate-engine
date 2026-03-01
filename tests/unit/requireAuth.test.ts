import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/server/auth/requireAuth";

const mockGetAuthCookie = vi.fn();
const mockVerifyToken = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("@/server/auth/cookies", () => ({
  getAuthCookie: (req: Request) => mockGetAuthCookie(req),
}));
vi.mock("@/server/auth/jwt", () => ({
  verifyToken: (token: string) => mockVerifyToken(token),
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

describe("requireAuth", () => {
  beforeEach(() => {
    mockGetAuthCookie.mockReset();
    mockVerifyToken.mockReset();
    mockUserFindUnique.mockReset();
  });

  it("returns null when no cookie", async () => {
    mockGetAuthCookie.mockReturnValue(null);

    const result = await requireAuth(new Request("http://localhost"));
    expect(result).toBeNull();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when token is invalid", async () => {
    mockGetAuthCookie.mockReturnValue("bad-token");
    mockVerifyToken.mockReturnValue(null);

    const result = await requireAuth(new Request("http://localhost"));
    expect(result).toBeNull();
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when user not found in DB", async () => {
    mockGetAuthCookie.mockReturnValue("valid-token");
    mockVerifyToken.mockReturnValue({ sub: "user-123" });
    mockUserFindUnique.mockResolvedValue(null);

    const result = await requireAuth(new Request("http://localhost"));
    expect(result).toBeNull();
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: { id: true },
    });
  });

  it("returns userId when token valid and user exists", async () => {
    mockGetAuthCookie.mockReturnValue("valid-token");
    mockVerifyToken.mockReturnValue({ sub: "user-123" });
    mockUserFindUnique.mockResolvedValue({ id: "user-123" });

    const result = await requireAuth(new Request("http://localhost"));
    expect(result).toBe("user-123");
  });
});
