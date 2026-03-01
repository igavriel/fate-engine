import { describe, it, expect } from "vitest";
import { sellItem } from "@/domain/inventory/sellItem";

describe("sellItem", () => {
  it("prevents selling equipped item", () => {
    const result = sellItem(10, 5, 1, true);
    expect(result.sold).toBe(false);
    expect(result.newCoins).toBe(10);
  });

  it("adds sellValueCoins * quantity when not equipped", () => {
    const result = sellItem(10, 5, 2, false);
    expect(result.sold).toBe(true);
    expect(result.newCoins).toBe(20);
  });

  it("adds correct coins for single item", () => {
    const result = sellItem(0, 3, 1, false);
    expect(result.sold).toBe(true);
    expect(result.newCoins).toBe(3);
  });
});
