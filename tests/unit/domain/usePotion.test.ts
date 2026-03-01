import { describe, it, expect } from "vitest";
import { usePotion } from "@/domain/inventory/usePotion";

describe("usePotion", () => {
  it("caps heal at hpMax", () => {
    const hpMax = 20;
    const healPercent = 25; // 25% of 20 = 5
    const { newHp, remainingQuantity } = usePotion(18, hpMax, healPercent, 1);
    expect(newHp).toBe(20);
    expect(remainingQuantity).toBe(0);
  });

  it("heals by floor(hpMax * healPercent/100)", () => {
    const hpMax = 100;
    const healPercent = 25; // 25
    const { newHp } = usePotion(50, hpMax, healPercent, 1);
    expect(newHp).toBe(75);
  });

  it("decrements quantity", () => {
    const { remainingQuantity } = usePotion(10, 20, 25, 3);
    expect(remainingQuantity).toBe(2);
  });

  it("returns same hp and 0 remaining when quantity is 0", () => {
    const { newHp, remainingQuantity } = usePotion(10, 20, 25, 0);
    expect(newHp).toBe(10);
    expect(remainingQuantity).toBe(0);
  });
});
