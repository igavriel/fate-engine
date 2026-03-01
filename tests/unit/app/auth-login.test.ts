import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/login/route";

const mockFindUnique = vi.fn();
const mockVerifyPassword = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));
vi.mock("@/server/auth/password", () => ({
  verifyPassword: (password: string, _hash: string) => mockVerifyPassword(password),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockVerifyPassword.mockReset();
  });

  it("returns 400 when email and password are missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("email and password");
  });

  it("returns 400 when body is empty", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nope@test.com", password: "secret123" }),
      })
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("Invalid");
  });

  it("returns 401 when password invalid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      passwordHash: "hash",
    });
    mockVerifyPassword.mockResolvedValue(false);
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with user and Set-Cookie when credentials valid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      passwordHash: "hash",
    });
    mockVerifyPassword.mockResolvedValue(true);
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "secret123" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: { id: string; email: string } };
    expect(data.user).toEqual({ id: "user-1", email: "a@b.com" });
    expect(res.headers.get("Set-Cookie")).toBeTruthy();
    expect(res.headers.get("Set-Cookie")).toContain("fe_auth=");
  });
});
