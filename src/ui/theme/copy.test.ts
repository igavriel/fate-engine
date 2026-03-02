import { describe, it, expect } from "vitest";
import { labels, actionLabels, screenCopy, vesselOrdinal } from "./copy";

describe("copy", () => {
  describe("labels", () => {
    const requiredKeys = [
      "Slot",
      "Inventory",
      "Coins",
      "HP",
      "Level",
      "Enemy",
      "Log",
      "Summary",
    ] as const;

    it("has all required label keys", () => {
      for (const key of requiredKeys) {
        expect(labels[key]).toBeDefined();
        expect(typeof labels[key]).toBe("string");
        expect((labels[key] as string).length).toBeGreaterThan(0);
      }
    });

    it("maps Slot to Vessel", () => {
      expect(labels.Slot).toBe("Vessel");
    });
    it("maps Inventory to Relics", () => {
      expect(labels.Inventory).toBe("Relics");
    });
    it("maps Coins to Ash", () => {
      expect(labels.Coins).toBe("Ash");
    });
    it("maps HP to Vitality", () => {
      expect(labels.HP).toBe("Vitality");
    });
    it("maps Level to Rank", () => {
      expect(labels.Level).toBe("Rank");
    });
    it("maps Enemy to Omen", () => {
      expect(labels.Enemy).toBe("Omen");
    });
    it("maps Log to Chronicle", () => {
      expect(labels.Log).toBe("Chronicle");
    });
    it("maps Summary to Aftermath", () => {
      expect(labels.Summary).toBe("Aftermath");
    });
  });

  describe("screenCopy", () => {
    it("has hub headline Pick your prey.", () => {
      expect(screenCopy.hub).toBe("Pick your prey.");
    });
    it("has slots copy", () => {
      expect(screenCopy.slots).toBe("Choose a vessel. Or bind a new one.");
    });
    it("has combat copy", () => {
      expect(screenCopy.combat).toBe("Break the omen.");
    });
    it("has aftermath outcomes", () => {
      expect(screenCopy.aftermathWin).toBe("The omen breaks.");
      expect(screenCopy.aftermathRetreat).toBe("You slip away.");
      expect(screenCopy.aftermathDefeat).toBe("The shrine claims you.");
    });
  });

  describe("actionLabels", () => {
    it("has Strike, Mend, Flee", () => {
      expect(actionLabels.strike).toBe("Strike");
      expect(actionLabels.mend).toBe("Mend");
      expect(actionLabels.flee).toBe("Flee");
    });
    it("has CONFRONT", () => {
      expect(actionLabels.confront).toBe("CONFRONT");
    });
    it("has RESUME DESCENT and BIND", () => {
      expect(actionLabels.resumeDescent).toBe("RESUME DESCENT");
      expect(actionLabels.bind).toBe("BIND");
    });
  });

  describe("vesselOrdinal", () => {
    it("returns I, II, III for 0, 1, 2", () => {
      expect(vesselOrdinal(0)).toBe("I");
      expect(vesselOrdinal(1)).toBe("II");
      expect(vesselOrdinal(2)).toBe("III");
    });
    it("returns string for out-of-range index", () => {
      expect(vesselOrdinal(10)).toBe("11");
    });
  });
});
