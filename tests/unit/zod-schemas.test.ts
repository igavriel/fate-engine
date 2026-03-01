import { describe, it, expect } from "vitest";
import {
  registerBodySchema,
  loginBodySchema,
} from "@/shared/zod/auth";
import { slotIndexQuerySchema, createCharacterBodySchema } from "@/shared/zod/game";
import { errorPayload } from "@/shared/zod/common";

describe("auth schemas", () => {
  it("registerBodySchema accepts valid email and password", () => {
    const data = registerBodySchema.parse({ email: "a@b.co", password: "12345678" });
    expect(data.email).toBe("a@b.co");
    expect(data.password).toBe("12345678");
  });

  it("registerBodySchema rejects short password", () => {
    expect(() =>
      registerBodySchema.parse({ email: "a@b.co", password: "short" })
    ).toThrow();
  });

  it("loginBodySchema accepts valid input", () => {
    const data = loginBodySchema.parse({ email: "u@v.com", password: "p" });
    expect(data.email).toBe("u@v.com");
    expect(data.password).toBe("p");
  });
});

describe("game schemas", () => {
  it("slotIndexQuerySchema parses slotIndex string to number", () => {
    const data = slotIndexQuerySchema.parse({ slotIndex: "2" });
    expect(data.slotIndex).toBe(2);
  });

  it("slotIndexQuerySchema rejects out-of-range", () => {
    expect(() => slotIndexQuerySchema.parse({ slotIndex: "5" })).toThrow();
  });

  it("createCharacterBodySchema accepts valid input", () => {
    const data = createCharacterBodySchema.parse({
      slotIndex: 1,
      name: "Hero",
      species: "ELF",
    });
    expect(data.slotIndex).toBe(1);
    expect(data.name).toBe("Hero");
    expect(data.species).toBe("ELF");
  });
});

describe("common errorPayload", () => {
  it("returns error shape with code and message", () => {
    const res = errorPayload("ERR", "msg");
    expect(res.error.code).toBe("ERR");
    expect(res.error.message).toBe("msg");
    expect(res.error.details).toBeUndefined();
  });

  it("includes details when provided", () => {
    const res = errorPayload("ERR", "msg", { field: "x" });
    expect(res.error.details).toEqual({ field: "x" });
  });
});
