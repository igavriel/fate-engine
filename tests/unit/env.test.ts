import { describe, it, expect, vi, afterEach } from "vitest";
import { env, parse, __testingClearEnvCache } from "@/server/env/env";

describe("env parsing", () => {
  afterEach(() => {
    __testingClearEnvCache();
  });

  it("provides LOG_LEVEL default when not set", () => {
    expect(["trace", "debug", "info", "warn", "error", "fatal"]).toContain(env.LOG_LEVEL);
  });

  it("provides LOG_PRETTY as boolean", () => {
    expect(typeof env.LOG_PRETTY).toBe("boolean");
  });

  it("parse returns cached result on second call", () => {
    __testingClearEnvCache();
    const first = parse();
    const second = parse();
    expect(first).toBe(second);
  });

  it("LOG_PRETTY is true when set to 1", () => {
    __testingClearEnvCache();
    const orig = process.env.LOG_PRETTY;
    process.env.LOG_PRETTY = "1";
    const parsed = parse();
    process.env.LOG_PRETTY = orig;
    expect(parsed.LOG_PRETTY).toBe(true);
  });

  it("throws with message when validation fails", async () => {
    const orig = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";
    vi.resetModules();
    await expect(import("@/server/env/env")).rejects.toThrow(/Env validation failed/);
    process.env.DATABASE_URL = orig;
    vi.resetModules();
    await import("@/server/env/env");
  });
});
