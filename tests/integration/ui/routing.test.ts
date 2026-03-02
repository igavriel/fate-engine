import { describe, it, expect } from "vitest";
import { routes } from "@/src/ui/nav/routes";

/**
 * Integration tests for routing / nav behavior.
 * Tests redirect logic via exported route helpers and validates canonical paths.
 */

describe("routing: auth guard redirect target", () => {
  it("unauthenticated users should be redirected to /seal (not /login)", () => {
    const target = routes.seal();
    expect(target).toBe("/seal");
    expect(target).not.toBe("/login");
  });

  it("the seal path matches what old /login redirects to", () => {
    expect(routes.seal()).toBe("/seal");
  });
});

describe("routing: canonical navigation from /vessels to /shrine", () => {
  it("a filled slot navigates to /shrine?slotIndex=1", () => {
    const slotIndex = 1;
    const destination = routes.shrine(slotIndex);
    expect(destination).toBe("/shrine?slotIndex=1");
    expect(destination).toContain("slotIndex=1");
  });

  it("empty slot navigates to /vessels/bind with correct slotIndex", () => {
    const slotIndex = 2;
    const destination = routes.bindVessel(slotIndex);
    expect(destination).toBe("/vessels/bind?slotIndex=2");
  });
});

describe("routing: shrine to combat", () => {
  it("starting an encounter navigates to /shrine/combat?slotIndex=N", () => {
    const destination = routes.combat(1);
    expect(destination).toBe("/shrine/combat?slotIndex=1");
    expect(destination).toMatch(/^\/shrine\/combat/);
    expect(destination).toContain("slotIndex=1");
  });
});

describe("routing: full canonical path map", () => {
  const canonicalPaths = [
    { name: "welcome", path: routes.welcome(), expected: "/" },
    { name: "seal", path: routes.seal(), expected: "/seal" },
    { name: "vessels", path: routes.vessels(), expected: "/vessels" },
    { name: "bindVessel(1)", path: routes.bindVessel(1), expected: "/vessels/bind?slotIndex=1" },
    { name: "shrine(1)", path: routes.shrine(1), expected: "/shrine?slotIndex=1" },
    { name: "combat(1)", path: routes.combat(1), expected: "/shrine/combat?slotIndex=1" },
  ];

  for (const { name, path, expected } of canonicalPaths) {
    it(`${name} resolves to ${expected}`, () => {
      expect(path).toBe(expected);
    });
  }
});

describe("routing: old routes map to new canonical routes", () => {
  it("/login -> /seal: auth forms now live at seal", () => {
    expect(routes.seal()).toBe("/seal");
  });

  it("/slots -> /vessels: vessel select now lives at vessels", () => {
    expect(routes.vessels()).toBe("/vessels");
  });

  it("/create -> /vessels/bind: character bind now lives at vessels/bind", () => {
    expect(routes.bindVessel()).toBe("/vessels/bind");
  });

  it("/game -> /shrine: hub now lives at shrine", () => {
    expect(routes.shrine(1)).toMatch(/^\/shrine/);
  });

  it("/combat -> /shrine/combat: combat now lives at shrine/combat", () => {
    expect(routes.combat(1)).toMatch(/^\/shrine\/combat/);
  });
});
