import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInventory,
  equipItem,
  unequipItem,
  consumePotionItem,
  sellItemFromInventory,
} from "@/server/game/inventoryService";

const mockRequireRunForSlot = vi.fn();
const mockRunInventoryItemFindMany = vi.fn();
const mockRunInventoryItemFindFirst = vi.fn();
const mockRunInventoryItemUpdate = vi.fn();
const mockRunInventoryItemDelete = vi.fn();
const mockRunEquipmentFindUnique = vi.fn();
const mockRunEquipmentUpdate = vi.fn();
const mockRunUpdate = vi.fn();

vi.mock("@/server/game/requireRunForSlot", () => ({
  requireRunForSlot: (...args: unknown[]) => mockRequireRunForSlot(...args),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    runInventoryItem: {
      findMany: (...args: unknown[]) => mockRunInventoryItemFindMany(...args),
      findFirst: (...args: unknown[]) => mockRunInventoryItemFindFirst(...args),
      update: (...args: unknown[]) => mockRunInventoryItemUpdate(...args),
      delete: (...args: unknown[]) => mockRunInventoryItemDelete(...args),
    },
    runEquipment: {
      findUnique: (...args: unknown[]) => mockRunEquipmentFindUnique(...args),
      update: (...args: unknown[]) => mockRunEquipmentUpdate(...args),
    },
    run: {
      update: (...args: unknown[]) => mockRunUpdate(...args),
    },
  },
}));

const runId = "run-1";
const baseRun = {
  id: runId,
  userId: "user-1",
  characterId: "char-1",
  seed: 42,
  fightCounter: 0,
  turnCounter: 0,
  hp: 18,
  coins: 10,
  lastOutcome: "NONE",
  stateJson: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  character: {
    id: "char-1",
    userId: "user-1",
    name: "Hero",
    species: "HUMAN",
    level: 1,
    xp: 0,
    baseAttack: 5,
    baseDefense: 5,
    baseLuck: 5,
    baseHpMax: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("inventoryService", () => {
  beforeEach(() => {
    mockRequireRunForSlot.mockReset();
    mockRunInventoryItemFindMany.mockReset();
    mockRunInventoryItemFindFirst.mockReset();
    mockRunInventoryItemUpdate.mockReset();
    mockRunInventoryItemDelete.mockReset();
    mockRunEquipmentFindUnique.mockReset();
    mockRunEquipmentUpdate.mockReset();
    mockRunUpdate.mockReset();
    mockRequireRunForSlot.mockResolvedValue({ run: baseRun });
  });

  describe("getInventory", () => {
    it("returns mapped inventory rows with catalog", async () => {
      const rows = [
        {
          id: "inv-1",
          runId,
          itemCatalogId: "cat-1",
          quantity: 1,
          itemCatalog: {
            id: "cat-1",
            name: "Rusty Sword",
            itemType: "WEAPON",
            attackBonus: 2,
            defenseBonus: 0,
            healPercent: 25,
            sellValueCoins: 5,
          },
        },
      ];
      mockRunInventoryItemFindMany.mockResolvedValue(rows);

      const result = await getInventory("user-1", 1);

      expect(mockRequireRunForSlot).toHaveBeenCalledWith("user-1", 1);
      expect(mockRunInventoryItemFindMany).toHaveBeenCalledWith({
        where: { runId },
        include: { itemCatalog: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "inv-1",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        catalog: {
          id: "cat-1",
          name: "Rusty Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      });
    });

    it("returns empty array when no items", async () => {
      mockRunInventoryItemFindMany.mockResolvedValue([]);

      const result = await getInventory("user-1", 2);

      expect(result).toEqual([]);
    });
  });

  describe("equipItem", () => {
    it("equips weapon and updates RunEquipment", async () => {
      const invItem = {
        id: "inv-weapon",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        itemCatalog: {
          id: "cat-1",
          name: "Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: null,
      });
      mockRunEquipmentUpdate.mockResolvedValue({});

      await equipItem("user-1", 1, "weapon", "inv-weapon");

      expect(mockRunEquipmentUpdate).toHaveBeenCalledWith({
        where: { runId },
        data: { weaponInventoryItemId: "inv-weapon", armorInventoryItemId: null },
      });
    });

    it("equips armor and updates RunEquipment", async () => {
      const invItem = {
        id: "inv-armor",
        runId,
        itemCatalogId: "cat-2",
        quantity: 1,
        itemCatalog: {
          id: "cat-2",
          name: "Vest",
          itemType: "ARMOR",
          attackBonus: 0,
          defenseBonus: 2,
          healPercent: 25,
          sellValueCoins: 7,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: null,
      });
      mockRunEquipmentUpdate.mockResolvedValue({});

      await equipItem("user-1", 1, "armor", "inv-armor");

      expect(mockRunEquipmentUpdate).toHaveBeenCalledWith({
        where: { runId },
        data: { weaponInventoryItemId: null, armorInventoryItemId: "inv-armor" },
      });
    });

    it("throws ITEM_NOT_FOUND when inventory item not found", async () => {
      mockRunInventoryItemFindFirst.mockResolvedValue(null);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: null,
      });

      await expect(equipItem("user-1", 1, "weapon", "bad-id")).rejects.toThrow("ITEM_NOT_FOUND");
      expect(mockRunEquipmentUpdate).not.toHaveBeenCalled();
    });

    it("throws EQUIPMENT_NOT_FOUND when run has no equipment row", async () => {
      mockRunInventoryItemFindFirst.mockResolvedValue({
        id: "inv-1",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        itemCatalog: {
          id: "cat-1",
          name: "Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      });
      mockRunEquipmentFindUnique.mockResolvedValue(null);

      await expect(equipItem("user-1", 1, "weapon", "inv-1")).rejects.toThrow(
        "EQUIPMENT_NOT_FOUND"
      );
      expect(mockRunEquipmentUpdate).not.toHaveBeenCalled();
    });
  });

  describe("unequipItem", () => {
    it("clears weapon slot", async () => {
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: "inv-w",
        armorInventoryItemId: null,
      });
      mockRunEquipmentUpdate.mockResolvedValue({});

      await unequipItem("user-1", 1, "weapon");

      expect(mockRunEquipmentUpdate).toHaveBeenCalledWith({
        where: { runId },
        data: { weaponInventoryItemId: null, armorInventoryItemId: null },
      });
    });

    it("clears armor slot", async () => {
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: "inv-a",
      });
      mockRunEquipmentUpdate.mockResolvedValue({});

      await unequipItem("user-1", 1, "armor");

      expect(mockRunEquipmentUpdate).toHaveBeenCalledWith({
        where: { runId },
        data: { weaponInventoryItemId: null, armorInventoryItemId: null },
      });
    });

    it("throws EQUIPMENT_NOT_FOUND when run has no equipment row", async () => {
      mockRunEquipmentFindUnique.mockResolvedValue(null);

      await expect(unequipItem("user-1", 1, "weapon")).rejects.toThrow("EQUIPMENT_NOT_FOUND");
      expect(mockRunEquipmentUpdate).not.toHaveBeenCalled();
    });
  });

  describe("consumePotionItem", () => {
    it("updates run hp and decrements quantity when remaining > 0", async () => {
      const invItem = {
        id: "inv-potion",
        runId,
        itemCatalogId: "cat-p",
        quantity: 2,
        itemCatalog: {
          id: "cat-p",
          name: "Potion",
          itemType: "POTION",
          attackBonus: 0,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 2,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunUpdate.mockResolvedValue({});
      mockRunInventoryItemUpdate.mockResolvedValue({});

      const result = await consumePotionItem("user-1", 1, "inv-potion");

      expect(result.newHp).toBe(20); // 18+5 capped at hpMax 20
      expect(mockRunUpdate).toHaveBeenCalledWith({
        where: { id: runId },
        data: { hp: 20 },
      });
      expect(mockRunInventoryItemUpdate).toHaveBeenCalledWith({
        where: { id: "inv-potion" },
        data: { quantity: 1 },
      });
      expect(mockRunInventoryItemDelete).not.toHaveBeenCalled();
    });

    it("deletes stack when quantity becomes 0", async () => {
      const invItem = {
        id: "inv-potion",
        runId,
        itemCatalogId: "cat-p",
        quantity: 1,
        itemCatalog: {
          id: "cat-p",
          name: "Potion",
          itemType: "POTION",
          attackBonus: 0,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 2,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunUpdate.mockResolvedValue({});
      mockRunInventoryItemDelete.mockResolvedValue({});

      const result = await consumePotionItem("user-1", 1, "inv-potion");

      expect(result.newHp).toBe(20); // 18+5 capped at hpMax 20
      expect(mockRunInventoryItemDelete).toHaveBeenCalledWith({ where: { id: "inv-potion" } });
      expect(mockRunInventoryItemUpdate).not.toHaveBeenCalled();
    });

    it("throws ITEM_NOT_FOUND when inventory item not found", async () => {
      mockRunInventoryItemFindFirst.mockResolvedValue(null);

      await expect(consumePotionItem("user-1", 1, "bad-id")).rejects.toThrow("ITEM_NOT_FOUND");
      expect(mockRunUpdate).not.toHaveBeenCalled();
    });

    it("throws NOT_A_POTION when item is not a potion", async () => {
      mockRunInventoryItemFindFirst.mockResolvedValue({
        id: "inv-w",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        itemCatalog: {
          id: "cat-1",
          name: "Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      });

      await expect(consumePotionItem("user-1", 1, "inv-w")).rejects.toThrow("NOT_A_POTION");
      expect(mockRunUpdate).not.toHaveBeenCalled();
    });
  });

  describe("sellItemFromInventory", () => {
    it("updates run coins and deletes item when not equipped", async () => {
      const invItem = {
        id: "inv-sell",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        itemCatalog: {
          id: "cat-1",
          name: "Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: null,
      });
      mockRunUpdate.mockResolvedValue({});
      mockRunInventoryItemDelete.mockResolvedValue({});

      const result = await sellItemFromInventory("user-1", 1, "inv-sell");

      expect(result.newCoins).toBe(15); // 10 + 5
      expect(mockRunUpdate).toHaveBeenCalledWith({
        where: { id: runId },
        data: { coins: 15 },
      });
      expect(mockRunInventoryItemDelete).toHaveBeenCalledWith({ where: { id: "inv-sell" } });
    });

    it("throws ITEM_NOT_FOUND when inventory item not found", async () => {
      mockRunInventoryItemFindFirst.mockResolvedValue(null);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: null,
      });

      await expect(sellItemFromInventory("user-1", 1, "bad-id")).rejects.toThrow("ITEM_NOT_FOUND");
      expect(mockRunUpdate).not.toHaveBeenCalled();
    });

    it("throws CANNOT_SELL_EQUIPPED when item is equipped as weapon", async () => {
      const invItem = {
        id: "inv-weapon",
        runId,
        itemCatalogId: "cat-1",
        quantity: 1,
        itemCatalog: {
          id: "cat-1",
          name: "Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: "inv-weapon",
        armorInventoryItemId: null,
      });

      await expect(sellItemFromInventory("user-1", 1, "inv-weapon")).rejects.toThrow(
        "CANNOT_SELL_EQUIPPED"
      );
      expect(mockRunUpdate).not.toHaveBeenCalled();
    });

    it("throws CANNOT_SELL_EQUIPPED when item is equipped as armor", async () => {
      const invItem = {
        id: "inv-armor",
        runId,
        itemCatalogId: "cat-2",
        quantity: 1,
        itemCatalog: {
          id: "cat-2",
          name: "Vest",
          itemType: "ARMOR",
          attackBonus: 0,
          defenseBonus: 2,
          healPercent: 25,
          sellValueCoins: 7,
        },
      };
      mockRunInventoryItemFindFirst.mockResolvedValue(invItem);
      mockRunEquipmentFindUnique.mockResolvedValue({
        runId,
        weaponInventoryItemId: null,
        armorInventoryItemId: "inv-armor",
      });

      await expect(sellItemFromInventory("user-1", 1, "inv-armor")).rejects.toThrow(
        "CANNOT_SELL_EQUIPPED"
      );
      expect(mockRunUpdate).not.toHaveBeenCalled();
    });
  });
});
