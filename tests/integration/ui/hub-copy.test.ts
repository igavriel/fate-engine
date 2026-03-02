/**
 * Integration test: copy and labels used on the game hub must be present and correct.
 * Ensures "Pick your prey.", Ash, Vitality, Rank appear as expected (no DOM).
 */
import { describe, it, expect } from "vitest";
import { labels, screenCopy } from "@/src/ui/theme/copy";

describe("Hub copy integration", () => {
  it("hub headline is Pick your prey.", () => {
    expect(screenCopy.hub).toBe("Pick your prey.");
  });

  it("status bar labels Ash, Vitality, Rank exist", () => {
    expect(labels.Coins).toBe("Ash");
    expect(labels.HP).toBe("Vitality");
    expect(labels.Level).toBe("Rank");
  });

  it("inventory and enemy labels used on hub exist", () => {
    expect(labels.Inventory).toBe("Relics");
    expect(labels.Enemy).toBe("Omen");
  });
});
