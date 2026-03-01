import { describe, it, expect } from "vitest";
import { getAuthCookie, setAuthCookie, clearAuthCookie } from "@/server/auth/cookies";

describe("cookies", () => {
  it("getAuthCookie returns null when no cookie header", () => {
    const request = new Request("http://localhost", { headers: {} });
    expect(getAuthCookie(request)).toBeNull();
  });

  it("getAuthCookie returns null when cookie does not contain fe_auth", () => {
    const request = new Request("http://localhost", {
      headers: { cookie: "other=value" },
    });
    expect(getAuthCookie(request)).toBeNull();
  });

  it("getAuthCookie returns token value when fe_auth is present", () => {
    const token = "abc.def.ghi";
    const request = new Request("http://localhost", {
      headers: { cookie: `fe_auth=${encodeURIComponent(token)}` },
    });
    expect(getAuthCookie(request)).toBe(token);
  });

  it("setAuthCookie returns Set-Cookie string with fe_auth and Max-Age", () => {
    const s = setAuthCookie("token123");
    expect(s).toContain("fe_auth=");
    expect(s).toContain("HttpOnly");
    expect(s).toContain("Path=/");
    expect(s).toMatch(/Max-Age=\d+/);
  });

  it("clearAuthCookie returns Set-Cookie string with Max-Age=0", () => {
    const s = clearAuthCookie();
    expect(s).toContain("fe_auth=");
    expect(s).toContain("Max-Age=0");
  });
});
