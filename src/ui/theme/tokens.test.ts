import { describe, it, expect } from "vitest";
import { colors, radii, shadows, spacing } from "./tokens";

describe("tokens", () => {
  describe("colors", () => {
    it("exports bg, surface, border, accent, textPrimary, textMuted", () => {
      expect(colors.bg).toBeDefined();
      expect(colors.surface).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.accent).toBeDefined();
      expect(colors.textPrimary).toBeDefined();
      expect(colors.textMuted).toBeDefined();
    });
    it("values are Tailwind-like class strings", () => {
      expect(typeof colors.bg).toBe("string");
      expect(colors.textPrimary).toMatch(/text-/);
    });
  });

  describe("radii", () => {
    it("exports sm, md, lg", () => {
      expect(radii.sm).toBeDefined();
      expect(radii.md).toBeDefined();
      expect(radii.lg).toBeDefined();
    });
  });

  describe("shadows", () => {
    it("exports panel and glow", () => {
      expect(shadows.panel).toBeDefined();
      expect(shadows.glow).toBeDefined();
    });
  });

  describe("spacing", () => {
    it("exports xs, sm, md, lg", () => {
      expect(spacing.xs).toBeDefined();
      expect(spacing.sm).toBeDefined();
      expect(spacing.md).toBeDefined();
      expect(spacing.lg).toBeDefined();
    });
  });
});
