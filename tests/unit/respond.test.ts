import { describe, it, expect } from "vitest";
import {
  ok,
  fail,
  json,
  badRequest,
  unauthorized,
  notFound,
  serverError,
  errorResponse,
} from "@/server/http/respond";

describe("respond helpers", () => {
  it("ok returns 200 and body", async () => {
    const res = ok({ ok: true });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("ok sets x-trace-id when traceId provided", () => {
    const res = ok({ x: 1 }, 200, "trace-123");
    expect(res.headers.get("x-trace-id")).toBe("trace-123");
  });

  it("fail returns error shape and status", async () => {
    const res = fail("BAD_REQUEST", "Invalid", 400);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("BAD_REQUEST");
    expect(data.error.message).toBe("Invalid");
  });

  it("fail includes details when provided", async () => {
    const res = fail("VALIDATION", "Failed", 400, { field: "email" });
    const data = (await res.json()) as {
      error: { code: string; message: string; details: unknown };
    };
    expect(data.error.details).toEqual({ field: "email" });
  });

  it("fail sets x-trace-id when traceId provided", () => {
    const res = fail("ERR", "msg", 500, undefined, "trace-456");
    expect(res.headers.get("x-trace-id")).toBe("trace-456");
  });

  it("json returns 200 and body", async () => {
    const res = json({ ok: true });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("json accepts custom status", async () => {
    const res = json({ id: "1" }, 201);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "1" });
  });

  it("badRequest returns 400 and error shape", async () => {
    const res = badRequest("Invalid input");
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("BAD_REQUEST");
    expect(data.error.message).toBe("Invalid input");
  });

  it("unauthorized returns 401 and error shape", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("notFound returns 404 and error shape", async () => {
    const res = notFound("Slot missing");
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("Slot missing");
  });

  it("serverError returns 500 and error shape", async () => {
    const res = serverError("DB failed");
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("INTERNAL_ERROR");
    expect(data.error.message).toBe("DB failed");
  });

  it("errorResponse returns custom code and status", async () => {
    const res = errorResponse("SLOT_NOT_FOUND", "Slot not found", 404);
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("SLOT_NOT_FOUND");
    expect(data.error.message).toBe("Slot not found");
  });

  it("no stack or internal fields in fail response", async () => {
    const res = fail("INTERNAL_ERROR", "Unexpected error", 500);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.stack).toBeUndefined();
    expect(data.error).toBeDefined();
    expect(Object.keys(data)).toEqual(["error"]);
  });
});
