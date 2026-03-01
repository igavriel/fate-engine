import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));
vi.mock("@/server/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockCreate.mockReset();
  });

  it("returns 400 when email and password missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when password less than 8 characters", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@test.com", password: "short" }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("8 characters");
  });

  it("returns 400 when email already registered", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing", email: "taken@test.com" });
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "taken@test.com", password: "password123" }),
      })
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toContain("already registered");
  });

  it("returns 200 with user on success", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "user-new",
      email: "new@test.com",
      createdAt: new Date("2025-01-15T12:00:00.000Z"),
    });
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@test.com", password: "password123" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: { id: string; email: string; createdAt: string } };
    expect(data.user).toEqual({
      id: "user-new",
      email: "new@test.com",
      createdAt: "2025-01-15T12:00:00.000Z",
    });
  });

  it("returns 500 when create throws", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error("DB error"));
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@test.com", password: "password123" }),
      })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { message: string } };
    expect(data.error.message).toBe("Registration failed");
  });
});
