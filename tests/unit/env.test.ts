import { describe, it, expect } from "vitest";
import { env } from "@/server/env/env";

describe("env parsing", () => {
  it("provides LOG_LEVEL default when not set", () => {
    expect(["trace", "debug", "info", "warn", "error", "fatal"]).toContain(env.LOG_LEVEL);
  });

  it("provides LOG_PRETTY as boolean", () => {
    expect(typeof env.LOG_PRETTY).toBe("boolean");
  });
});
