import { describe, it, expect } from "vitest";
import { getTraceId, runWithTraceId } from "@/server/http/trace";

describe("trace", () => {
  it("getTraceId returns x-trace-id from request when present", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-trace-id": "custom-trace-123" },
    });
    expect(getTraceId(req)).toBe("custom-trace-123");
  });

  it("runWithTraceId provides stable traceId via getTraceId inside fn", async () => {
    const req = new Request("http://localhost/");
    let captured: string | null = null;
    await runWithTraceId(req, async () => {
      captured = getTraceId(req);
      return new Response();
    });
    expect(captured).toBeTruthy();
    expect(captured).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("runWithTraceId reuses x-trace-id from request", async () => {
    const req = new Request("http://localhost/", {
      headers: { "x-trace-id": "reuse-me" },
    });
    let captured: string | null = null;
    await runWithTraceId(req, async () => {
      captured = getTraceId(req);
      return new Response();
    });
    expect(captured).toBe("reuse-me");
  });
});
