import { describe, it, expect } from "vitest";
import { equipSwap, unequipSlot } from "@/domain/inventory/equipSwap";

const initial: { weaponInventoryItemId: string | null; armorInventoryItemId: string | null } = {
  weaponInventoryItemId: null,
  armorInventoryItemId: null,
};

describe("equipSwap", () => {
  it("equips weapon to weapon slot (swap behavior)", () => {
    const next = equipSwap(initial, "weapon", "WEAPON", "inv-weapon-1");
    expect(next.weaponInventoryItemId).toBe("inv-weapon-1");
    expect(next.armorInventoryItemId).toBeNull();
  });

  it("swaps weapon when slot already has a weapon", () => {
    const current = { ...initial, weaponInventoryItemId: "old-weapon" };
    const next = equipSwap(current, "weapon", "WEAPON", "new-weapon");
    expect(next.weaponInventoryItemId).toBe("new-weapon");
    expect(next.armorInventoryItemId).toBeNull();
  });

  it("equips armor to armor slot", () => {
    const next = equipSwap(initial, "armor", "ARMOR", "inv-armor-1");
    expect(next.armorInventoryItemId).toBe("inv-armor-1");
    expect(next.weaponInventoryItemId).toBeNull();
  });

  it("swaps armor when slot already has armor", () => {
    const current = { ...initial, armorInventoryItemId: "old-armor" };
    const next = equipSwap(current, "armor", "ARMOR", "new-armor");
    expect(next.armorInventoryItemId).toBe("new-armor");
  });

  it("rejects WEAPON to armor slot", () => {
    const next = equipSwap(initial, "armor", "WEAPON", "inv-weapon-1");
    expect(next).toEqual(initial);
  });

  it("rejects ARMOR to weapon slot", () => {
    const next = equipSwap(initial, "weapon", "ARMOR", "inv-armor-1");
    expect(next).toEqual(initial);
  });

  it("rejects POTION to weapon and armor slots", () => {
    expect(equipSwap(initial, "weapon", "POTION", "inv-potion-1")).toEqual(initial);
    expect(equipSwap(initial, "armor", "POTION", "inv-potion-1")).toEqual(initial);
  });
});

describe("unequipSlot", () => {
  it("clears weapon slot", () => {
    const current = { weaponInventoryItemId: "w1", armorInventoryItemId: null };
    expect(unequipSlot(current, "weapon")).toEqual({
      weaponInventoryItemId: null,
      armorInventoryItemId: null,
    });
  });

  it("clears armor slot", () => {
    const current = { weaponInventoryItemId: null, armorInventoryItemId: "a1" };
    expect(unequipSlot(current, "armor")).toEqual({
      weaponInventoryItemId: null,
      armorInventoryItemId: null,
    });
  });
});
