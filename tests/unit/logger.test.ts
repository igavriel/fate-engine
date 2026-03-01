import { describe, it, expect } from "vitest";
import { logger, withTraceId } from "@/server/log/logger";

describe("logger", () => {
  it("creates logger without crashing", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    const child = withTraceId("trace-1");
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});
