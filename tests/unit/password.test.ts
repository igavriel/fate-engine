import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password", () => {
  it("hashPassword returns a string different from input", async () => {
    const hash = await hashPassword("mypassword");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("mypassword");
  });

  it("verifyPassword returns true for correct password", async () => {
    const plain = "secret123";
    const hash = await hashPassword(plain);
    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });

  it("verifyPassword returns false for wrong password", async () => {
    const hash = await hashPassword("correct");
    const ok = await verifyPassword("wrong", hash);
    expect(ok).toBe(false);
  });
});
