import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 and json with status and ts", async () => {
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; ts: string };
    expect(data.status).toBe("ok");
    expect(data.ts).toBeDefined();
    expect(() => new Date(data.ts)).not.toThrow();
  });

  it("includes x-trace-id header", async () => {
    const res = await GET(
      new Request("http://localhost/api/health", { headers: { "x-trace-id": "trace-xyz" } })
    );
    expect(res.headers.get("x-trace-id")).toBe("trace-xyz");
  });
});
