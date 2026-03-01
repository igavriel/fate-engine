import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/db-check/route";

const mockUpsert = vi.fn();

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    appConfig: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

describe("GET /api/db-check", () => {
  beforeEach(() => {
    mockUpsert.mockReset().mockResolvedValue(undefined);
  });

  it("returns 200 with db connected when upsert succeeds", async () => {
    const res = await GET(new Request("http://localhost/api/db-check"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; db: string; updatedKey: string };
    expect(data).toEqual({
      status: "ok",
      db: "connected",
      updatedKey: "last_db_check",
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { key: "last_db_check" },
      create: expect.objectContaining({ key: "last_db_check" }),
      update: expect.objectContaining({ value: expect.any(String) }),
    });
  });

  it("returns 500 when upsert throws", async () => {
    mockUpsert.mockRejectedValueOnce(new Error("Connection refused"));
    const res = await GET(new Request("http://localhost/api/db-check"));
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
    expect(data.error.message).toBe("Database connection failed");
  });
});
