import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/server/auth/jwt";

describe("jwt", () => {
  it("signToken returns a non-empty string", () => {
    const token = signToken({ sub: "user-1", email: "a@b.com" });
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("verifyToken returns payload for valid token", () => {
    const payload = { sub: "user-1", email: "test@example.com" };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(payload.sub);
    expect(decoded?.email).toBe(payload.email);
  });

  it("verifyToken returns null for invalid token", () => {
    expect(verifyToken("invalid")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
});
