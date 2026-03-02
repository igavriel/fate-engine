import { describe, it, expect } from "vitest";
import { getLevelBracket, BRACKET_SIZE } from "@/domain/items/levelBrackets";

describe("levelBrackets", () => {
  describe("BRACKET_SIZE", () => {
    it("is 5", () => {
      expect(BRACKET_SIZE).toBe(5);
    });
  });

  describe("getLevelBracket", () => {
    it("level 1 → bracket 1-5", () => {
      const { bracketMin, bracketMax } = getLevelBracket(1);
      expect(bracketMin).toBe(1);
      expect(bracketMax).toBe(5);
    });

    it("levels 2-5 → bracket 1-5", () => {
      for (const level of [2, 3, 4, 5]) {
        const { bracketMin, bracketMax } = getLevelBracket(level);
        expect(bracketMin).toBe(1);
        expect(bracketMax).toBe(5);
      }
    });

    it("level 6 → bracket 6-10", () => {
      const { bracketMin, bracketMax } = getLevelBracket(6);
      expect(bracketMin).toBe(6);
      expect(bracketMax).toBe(10);
    });

    it("levels 6-10 → bracket 6-10", () => {
      for (const level of [6, 7, 8, 9, 10]) {
        const { bracketMin, bracketMax } = getLevelBracket(level);
        expect(bracketMin).toBe(6);
        expect(bracketMax).toBe(10);
      }
    });

    it("level 11 → bracket 11-15", () => {
      const { bracketMin, bracketMax } = getLevelBracket(11);
      expect(bracketMin).toBe(11);
      expect(bracketMax).toBe(15);
    });

    it("level 16 → bracket 16-20", () => {
      const { bracketMin, bracketMax } = getLevelBracket(16);
      expect(bracketMin).toBe(16);
      expect(bracketMax).toBe(20);
    });

    it("level 20 → bracket 16-20", () => {
      const { bracketMin, bracketMax } = getLevelBracket(20);
      expect(bracketMin).toBe(16);
      expect(bracketMax).toBe(20);
    });

    it("bracket width is BRACKET_SIZE", () => {
      for (const level of [1, 5, 6, 10, 11, 15, 16, 20]) {
        const { bracketMin, bracketMax } = getLevelBracket(level);
        expect(bracketMax - bracketMin + 1).toBe(BRACKET_SIZE);
      }
    });

    it("level 0 or negative clamped to bracket 1-5", () => {
      const { bracketMin, bracketMax } = getLevelBracket(0);
      expect(bracketMin).toBe(1);
      expect(bracketMax).toBe(5);
    });
  });
});
