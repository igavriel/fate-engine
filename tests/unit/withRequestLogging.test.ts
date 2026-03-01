import { describe, it, expect } from "vitest";
import { withRequestLogging } from "@/server/http/withRequestLogging";

describe("withRequestLogging", () => {
  it("adds x-trace-id to successful response", async () => {
    const handler = withRequestLogging(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    const req = new Request("http://localhost/api/health", {
      headers: { "x-trace-id": "trace-123" },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-trace-id")).toBe("trace-123");
  });

  it("on handler throw returns 500 and adds x-trace-id", async () => {
    const handler = withRequestLogging(async () => {
      throw new Error("Unexpected");
    });
    const req = new Request("http://localhost/api/foo", {
      headers: { "x-trace-id": "trace-456" },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(res.headers.get("x-trace-id")).toBe("trace-456");
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
    expect(data.error.message).toBe("Unexpected error");
  });
});
