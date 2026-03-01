import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/db-check/route";

// Consider "real DB" only when URL was explicitly set and is not a known dummy/default
const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("db-check route", () => {
  it("returns x-trace-id header on response", async () => {
    const req = new Request("http://localhost/api/db-check");
    const res = await GET(req);
    const traceId = res.headers.get("x-trace-id");
    expect(traceId).toBeTruthy();
    expect(traceId).toMatch(uuidRe);
  });

  it("echoes client x-trace-id when provided", async () => {
    const req = new Request("http://localhost/api/db-check", {
      headers: { "x-trace-id": "client-trace-abc" },
    });
    const res = await GET(req);
    expect(res.headers.get("x-trace-id")).toBe("client-trace-abc");
  });

  it("returns db connected when DATABASE_URL is valid", async () => {
    const req = new Request("http://localhost/api/db-check");
    const res = await GET(req);
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
