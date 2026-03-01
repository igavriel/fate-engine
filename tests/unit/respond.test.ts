import { describe, it, expect } from "vitest";
import { json, badRequest, unauthorized, notFound, serverError } from "@/server/http/respond";

describe("respond helpers", () => {
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
});
