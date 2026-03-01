import { describe, it, expect } from "vitest";
import { parseJson } from "@/server/http/validate";
import { z } from "zod";

const schema = z.object({ name: z.string(), count: z.number() });

describe("parseJson", () => {
  it("returns success with parsed data when JSON and schema are valid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "x", count: 1 }),
    });
    const result = await parseJson(request, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "x", count: 1 });
    }
  });

  it("returns error when body is invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not json",
    });
    const result = await parseJson(request, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid JSON");
    }
  });

  it("returns error when schema validation fails", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "x" }),
    });
    const result = await parseJson(request, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/count|body/);
    }
  });
});
