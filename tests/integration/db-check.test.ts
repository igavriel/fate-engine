import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/db-check/route";

// Consider "real DB" only when URL was explicitly set and is not a known dummy/default
const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

describe("db-check route", () => {
  it("returns db connected when DATABASE_URL is valid", async () => {
    const res = await GET();
    const data = (await res.json()) as { status?: string; db?: string; updatedKey?: string };
    if (!hasRealDb) {
      // Without a real DB we expect 500; just ensure the handler runs
      expect([200, 500]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      status: "ok",
      db: "connected",
      updatedKey: "last_db_check",
    });
  });
});
