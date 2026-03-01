export type ItemType = "WEAPON" | "ARMOR" | "POTION";

export type EquipmentState = {
  weaponInventoryItemId: string | null;
  armorInventoryItemId: string | null;
};

/**
 * Swap or set equipment. Caller must validate ownership of inventoryItemId.
 * - Only WEAPON goes to weapon slot; only ARMOR goes to armor slot.
 * - Passing an id for the matching slot performs a swap (equip that item).
 * - Returns new equipment state.
 */
export function equipSwap(
  current: EquipmentState,
  slot: "weapon" | "armor",
  itemType: ItemType,
  inventoryItemId: string
): EquipmentState {
  if (slot === "weapon" && itemType !== "WEAPON") return current;
  if (slot === "armor" && itemType !== "ARMOR") return current;

  if (slot === "weapon") {
    return { ...current, weaponInventoryItemId: inventoryItemId };
  }
  return { ...current, armorInventoryItemId: inventoryItemId };
}

/**
 * Unequip a slot. Returns new equipment state.
 */
export function unequipSlot(current: EquipmentState, slot: "weapon" | "armor"): EquipmentState {
  if (slot === "weapon") {
    return { ...current, weaponInventoryItemId: null };
  }
  return { ...current, armorInventoryItemId: null };
}
