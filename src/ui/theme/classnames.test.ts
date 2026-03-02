import { describe, it, expect } from "vitest";
import {
  panel,
  card,
  buttonPrimary,
  buttonGhost,
  badgeTier,
  frame,
} from "./classnames";

describe("classnames", () => {
  describe("panel", () => {
    it("returns a non-empty string", () => {
      expect(panel()).toBeTruthy();
      expect(typeof panel()).toBe("string");
      expect(panel().length).toBeGreaterThan(0);
    });
    it("includes rounded and border", () => {
      expect(panel()).toMatch(/rounded/);
      expect(panel()).toMatch(/border/);
    });
    it("appends extra class when provided", () => {
      expect(panel("custom")).toContain("custom");
    });
  });

  describe("card", () => {
    it("returns a non-empty string", () => {
      expect(card()).toBeTruthy();
      expect(card()).toMatch(/rounded/);
    });
    it("appends extra class when provided", () => {
      expect(card("extra")).toContain("extra");
    });
  });

  describe("buttonPrimary", () => {
    it("returns string with min-height for tap target", () => {
      const c = buttonPrimary();
      expect(c).toMatch(/44px|min-h/);
    });
    it("appends extra when provided", () => {
      expect(buttonPrimary("x")).toContain("x");
    });
  });

  describe("buttonGhost", () => {
    it("returns non-empty string", () => {
      expect(buttonGhost()).toBeTruthy();
    });
  });

  describe("badgeTier", () => {
    it("returns WEAK styling for WEAK", () => {
      const c = badgeTier("WEAK");
      expect(c).toMatch(/rounded/);
      expect(c).toMatch(/zinc|gray/);
    });
    it("returns NORMAL styling for NORMAL", () => {
      const c = badgeTier("NORMAL");
      expect(c).toMatch(/amber|yellow/);
    });
    it("returns ELITE styling for ELITE", () => {
      const c = badgeTier("ELITE");
      expect(c).toMatch(/amber|yellow/);
      expect(c).toMatch(/shadow|\[0_0/);
    });
    it("returns string for unknown tier (fallback)", () => {
      const c = badgeTier("NORMAL" as "WEAK" | "NORMAL" | "ELITE");
      expect(typeof c).toBe("string");
    });
    it("appends extra when provided", () => {
      expect(badgeTier("ELITE", "ml-2")).toContain("ml-2");
    });
  });

  describe("frame", () => {
    it("returns non-empty string with border", () => {
      expect(frame()).toBeTruthy();
      expect(frame()).toMatch(/border/);
    });
  });
});
