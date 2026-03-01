import { describe, it, expect } from "vitest";
import { computeIsRecoverable } from "@/domain/run/isRecoverable";

describe("computeIsRecoverable", () => {
  it("returns true when hp > 0 (no potion needed)", () => {
    expect(computeIsRecoverable(1, false)).toBe(true);
    expect(computeIsRecoverable(10, false)).toBe(true);
  });

  it("returns true when hasPotion even if hp is 0", () => {
    expect(computeIsRecoverable(0, true)).toBe(true);
  });

  it("returns false when hp is 0 and no potion", () => {
    expect(computeIsRecoverable(0, false)).toBe(false);
  });

  it("returns true when hp > 0 and hasPotion", () => {
    expect(computeIsRecoverable(5, true)).toBe(true);
  });
});
