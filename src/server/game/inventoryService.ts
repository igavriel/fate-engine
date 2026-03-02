import { prisma } from "@/server/db/prisma";
import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import { equipSwap, unequipSlot, type ItemType } from "@/domain/inventory/equipSwap";
import { applyPotion } from "@/domain/inventory/usePotion";
import { sellItem } from "@/domain/inventory/sellItem";

export type InventoryItemRow = {
  id: string;
  runId: string;
  itemCatalogId: string;
  quantity: number;
  catalog: {
    id: string;
    name: string;
    itemType: "WEAPON" | "ARMOR" | "POTION";
    attackBonus: number;
    defenseBonus: number;
    healPercent: number;
    sellValueCoins: number;
    requiredLevel?: number;
    powerScore?: number;
  };
};

/**
 * Get inventory for the run in the given slot. Returns items with catalog info.
 */
export async function getInventory(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<InventoryItemRow[]> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const rows = await prisma.runInventoryItem.findMany({
    where: { runId: run.id },
    include: {
      itemCatalog: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    runId: r.runId,
    itemCatalogId: r.itemCatalogId,
    quantity: r.quantity,
    catalog: {
      id: r.itemCatalog.id,
      name: r.itemCatalog.name,
      itemType: r.itemCatalog.itemType,
      attackBonus: r.itemCatalog.attackBonus,
      defenseBonus: r.itemCatalog.defenseBonus,
      healPercent: r.itemCatalog.healPercent,
      sellValueCoins: r.itemCatalog.sellValueCoins,
      requiredLevel: r.itemCatalog.requiredLevel,
      powerScore: r.itemCatalog.powerScore,
    },
  }));
}

/**
 * Equip an inventory item into weapon or armor slot. Validates item type and ownership.
 */
export async function equipItem(
  userId: string,
  slotIndex: 1 | 2 | 3,
  equipmentSlot: "weapon" | "armor",
  inventoryItemId: string
): Promise<void> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const [invItem, equipment] = await Promise.all([
    prisma.runInventoryItem.findFirst({
      where: { id: inventoryItemId, runId: run.id },
      include: { itemCatalog: true },
    }),
    prisma.runEquipment.findUnique({ where: { runId: run.id } }),
  ]);
  if (!invItem) throw new Error("ITEM_NOT_FOUND");
  if (!equipment) throw new Error("EQUIPMENT_NOT_FOUND");
  const itemType = invItem.itemCatalog.itemType as ItemType;
  const next = equipSwap(
    {
      weaponInventoryItemId: equipment.weaponInventoryItemId,
      armorInventoryItemId: equipment.armorInventoryItemId,
    },
    equipmentSlot,
    itemType,
    inventoryItemId
  );
  await prisma.runEquipment.update({
    where: { runId: run.id },
    data: {
      weaponInventoryItemId: next.weaponInventoryItemId,
      armorInventoryItemId: next.armorInventoryItemId,
    },
  });
}

/**
 * Unequip weapon or armor slot.
 */
export async function unequipItem(
  userId: string,
  slotIndex: 1 | 2 | 3,
  equipmentSlot: "weapon" | "armor"
): Promise<void> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const equipment = await prisma.runEquipment.findUnique({ where: { runId: run.id } });
  if (!equipment) throw new Error("EQUIPMENT_NOT_FOUND");
  const next = unequipSlot(
    {
      weaponInventoryItemId: equipment.weaponInventoryItemId,
      armorInventoryItemId: equipment.armorInventoryItemId,
    },
    equipmentSlot
  );
  await prisma.runEquipment.update({
    where: { runId: run.id },
    data: {
      weaponInventoryItemId: next.weaponInventoryItemId,
      armorInventoryItemId: next.armorInventoryItemId,
    },
  });
}

/**
 * Use one potion from an inventory stack. Updates run hp and decrements or deletes stack.
 */
export async function consumePotionItem(
  userId: string,
  slotIndex: 1 | 2 | 3,
  inventoryItemId: string
): Promise<{ newHp: number }> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const invItem = await prisma.runInventoryItem.findFirst({
    where: { id: inventoryItemId, runId: run.id },
    include: { itemCatalog: true },
  });
  if (!invItem) throw new Error("ITEM_NOT_FOUND");
  if (invItem.itemCatalog.itemType !== "POTION") throw new Error("NOT_A_POTION");
  const hpMax = run.character.baseHpMax;
  const { newHp, remainingQuantity } = applyPotion(
    run.hp,
    hpMax,
    invItem.itemCatalog.healPercent,
    invItem.quantity
  );
  await prisma.run.update({
    where: { id: run.id },
    data: { hp: newHp },
  });
  if (remainingQuantity === 0) {
    await prisma.runInventoryItem.delete({ where: { id: inventoryItemId } });
  } else {
    await prisma.runInventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantity: remainingQuantity },
    });
  }
  return { newHp };
}

/**
 * Sell an inventory item. Cannot sell equipped items. Updates run coins and quantity or deletes stack.
 */
export async function sellItemFromInventory(
  userId: string,
  slotIndex: 1 | 2 | 3,
  inventoryItemId: string
): Promise<{ newCoins: number }> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const [invItem, equipment] = await Promise.all([
    prisma.runInventoryItem.findFirst({
      where: { id: inventoryItemId, runId: run.id },
      include: { itemCatalog: true },
    }),
    prisma.runEquipment.findUnique({ where: { runId: run.id } }),
  ]);
  if (!invItem) throw new Error("ITEM_NOT_FOUND");
  const isEquipped =
    equipment?.weaponInventoryItemId === inventoryItemId ||
    equipment?.armorInventoryItemId === inventoryItemId;
  const { newCoins, sold } = sellItem(
    run.coins,
    invItem.itemCatalog.sellValueCoins,
    invItem.quantity,
    isEquipped
  );
  if (!sold) throw new Error("CANNOT_SELL_EQUIPPED");
  await prisma.run.update({
    where: { id: run.id },
    data: { coins: newCoins },
  });
  await prisma.runInventoryItem.delete({ where: { id: inventoryItemId } });
  return { newCoins };
}
