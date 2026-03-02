import { describe, it, expect } from "vitest";
import { routes } from "./routes";

describe("routes", () => {
  describe("welcome", () => {
    it("returns /", () => {
      expect(routes.welcome()).toBe("/");
    });
  });

  describe("seal", () => {
    it("returns /seal", () => {
      expect(routes.seal()).toBe("/seal");
    });
  });

  describe("vessels", () => {
    it("returns /vessels", () => {
      expect(routes.vessels()).toBe("/vessels");
    });
  });

  describe("bindVessel", () => {
    it("returns /vessels/bind when no slotIndex", () => {
      expect(routes.bindVessel()).toBe("/vessels/bind");
    });

    it("returns /vessels/bind with slotIndex query param when provided", () => {
      expect(routes.bindVessel(1)).toBe("/vessels/bind?slotIndex=1");
      expect(routes.bindVessel(2)).toBe("/vessels/bind?slotIndex=2");
      expect(routes.bindVessel(3)).toBe("/vessels/bind?slotIndex=3");
    });

    it("returns /vessels/bind when slotIndex is undefined", () => {
      expect(routes.bindVessel(undefined)).toBe("/vessels/bind");
    });
  });

  describe("shrine", () => {
    it("returns /shrine with slotIndex query param", () => {
      expect(routes.shrine(1)).toBe("/shrine?slotIndex=1");
      expect(routes.shrine(2)).toBe("/shrine?slotIndex=2");
      expect(routes.shrine(3)).toBe("/shrine?slotIndex=3");
    });
  });

  describe("combat", () => {
    it("returns /shrine/combat with slotIndex query param", () => {
      expect(routes.combat(1)).toBe("/shrine/combat?slotIndex=1");
      expect(routes.combat(2)).toBe("/shrine/combat?slotIndex=2");
      expect(routes.combat(3)).toBe("/shrine/combat?slotIndex=3");
    });
  });

  describe("auth guard target", () => {
    it("unauthenticated redirect target is /seal (not /login)", () => {
      expect(routes.seal()).toBe("/seal");
      expect(routes.seal()).not.toBe("/login");
    });
  });

  describe("route shapes", () => {
    it("all routes start with /", () => {
      expect(routes.welcome()).toMatch(/^\//);
      expect(routes.seal()).toMatch(/^\//);
      expect(routes.vessels()).toMatch(/^\//);
      expect(routes.bindVessel(1)).toMatch(/^\//);
      expect(routes.shrine(1)).toMatch(/^\//);
      expect(routes.combat(1)).toMatch(/^\//);
    });

    it("shrine and combat preserve slotIndex in query string", () => {
      expect(routes.shrine(1)).toContain("slotIndex=1");
      expect(routes.combat(1)).toContain("slotIndex=1");
    });

    it("combat is nested under /shrine", () => {
      expect(routes.combat(1)).toMatch(/^\/shrine\/combat/);
    });

    it("bindVessel includes slotIndex when given", () => {
      expect(routes.bindVessel(2)).toContain("slotIndex=2");
    });
  });
});
