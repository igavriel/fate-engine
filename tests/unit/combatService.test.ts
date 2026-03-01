import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CombatError,
  startEncounter,
  getCombat,
  getSummary,
  ackSummary,
  applyAction,
} from "@/server/game/combatService";

const mockRequireRunForSlot = vi.fn();
const mockRunUpdate = vi.fn();
const mockRunEquipmentFindUnique = vi.fn();
const mockRunInventoryItemFindMany = vi.fn();
const mockGetGameStatus = vi.fn();
const mockGetInventory = vi.fn();

vi.mock("@/server/game/requireRunForSlot", () => ({
  requireRunForSlot: (...args: unknown[]) => mockRequireRunForSlot(...args),
}));

const mockTxCharacterUpdate = vi.fn().mockResolvedValue(undefined);
const mockTxRunUpdate = vi.fn().mockResolvedValue(undefined);
const mockTxRunInventoryItemFindFirst = vi.fn().mockResolvedValue(null);
const mockTxRunInventoryItemUpdate = vi.fn().mockResolvedValue(undefined);
const mockTxRunInventoryItemCreate = vi.fn().mockResolvedValue(undefined);
const mockTxRunInventoryItemDelete = vi.fn().mockResolvedValue(undefined);
const mockTxCharacterStatsFindUnique = vi.fn().mockResolvedValue({ totalFights: 0, wins: 0, totalCoinsEarned: 0, enemiesBySpecies: {} });
const mockTxCharacterStatsUpdate = vi.fn().mockResolvedValue(undefined);
const mockCharacterStatsFindUnique = vi.fn().mockResolvedValue(null);
const mockCharacterStatsUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    run: { update: (...args: unknown[]) => mockRunUpdate(...args) },
    runEquipment: {
      findUnique: (...args: unknown[]) => mockRunEquipmentFindUnique(...args),
    },
    runInventoryItem: {
      findMany: (...args: unknown[]) => mockRunInventoryItemFindMany(...args),
    },
    character: { update: vi.fn().mockResolvedValue(undefined) },
    characterStats: {
      findUnique: (...args: unknown[]) => mockCharacterStatsFindUnique(...args),
      update: (...args: unknown[]) => mockCharacterStatsUpdate(...args),
    },
    itemCatalog: {
      findMany: vi.fn().mockResolvedValue([{ id: "cat-1" }]),
      findUnique: vi.fn().mockResolvedValue({ name: "Item", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 25 }),
    },
    $transaction: vi.fn((fn: (tx: {
      character: { update: typeof mockTxCharacterUpdate };
      run: { update: typeof mockTxRunUpdate };
      runInventoryItem: {
        findFirst: typeof mockTxRunInventoryItemFindFirst;
        update: typeof mockTxRunInventoryItemUpdate;
        create: typeof mockTxRunInventoryItemCreate;
        delete: typeof mockTxRunInventoryItemDelete;
      };
      characterStats: { findUnique: typeof mockTxCharacterStatsFindUnique; update: typeof mockTxCharacterStatsUpdate };
    }) => Promise<unknown>) =>
      fn({
        character: { update: mockTxCharacterUpdate },
        run: { update: mockTxRunUpdate },
        runInventoryItem: {
          findFirst: mockTxRunInventoryItemFindFirst,
          update: mockTxRunInventoryItemUpdate,
          create: mockTxRunInventoryItemCreate,
          delete: mockTxRunInventoryItemDelete,
        },
        characterStats: {
          findUnique: mockTxCharacterStatsFindUnique,
          update: mockTxCharacterStatsUpdate,
        },
      })),
  },
}));

vi.mock("@/server/game/status", () => ({
  getGameStatus: (...args: unknown[]) => mockGetGameStatus(...args),
}));
vi.mock("@/server/game/inventoryService", () => ({
  getInventory: (...args: unknown[]) => mockGetInventory(...args),
}));

const mockGenerateLoot = vi.fn();
vi.mock("@/domain/loot/generateLoot", () => ({
  generateLoot: (...args: unknown[]) => mockGenerateLoot(...args),
}));


const runId = "run-1";
const charId = "char-1";
const baseRun = {
  id: runId,
  userId: "user-1",
  characterId: charId,
  seed: 42,
  fightCounter: 0,
  turnCounter: 0,
  hp: 20,
  coins: 50,
  lastOutcome: "NONE",
  stateJson: null as unknown,
  createdAt: new Date(),
  updatedAt: new Date(),
  character: {
    id: charId,
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

describe("combatService", () => {
  beforeEach(() => {
    mockRequireRunForSlot.mockReset();
    mockRunUpdate.mockReset();
    mockRunEquipmentFindUnique.mockReset();
    mockRunInventoryItemFindMany.mockResolvedValue([]);
    mockGetGameStatus.mockReset();
    mockGetInventory.mockReset();
    mockCharacterStatsFindUnique.mockResolvedValue(null);
    mockCharacterStatsUpdate.mockResolvedValue(undefined);
    mockGenerateLoot.mockReturnValue({ coinsGained: 10, itemDrops: [] });
    mockRequireRunForSlot.mockResolvedValue({ character: baseRun.character, run: baseRun });
    mockRunUpdate.mockResolvedValue(undefined);
    mockRunEquipmentFindUnique.mockResolvedValue(null);
    mockGetGameStatus.mockResolvedValue({ slotIndex: 1, run: {} });
    mockGetInventory.mockResolvedValue([]);
    mockTxCharacterUpdate.mockResolvedValue(undefined);
    mockTxRunUpdate.mockResolvedValue(undefined);
    mockTxRunInventoryItemFindFirst.mockResolvedValue(null);
    mockTxRunInventoryItemDelete.mockResolvedValue(undefined);
    mockTxCharacterStatsFindUnique.mockResolvedValue({
      totalFights: 0,
      wins: 0,
      totalCoinsEarned: 0,
      enemiesBySpecies: {},
    });
    mockTxCharacterStatsUpdate.mockResolvedValue(undefined);
  });

  describe("startEncounter", () => {
    it("returns encounterId and updates run when no summary or encounter", async () => {
      const result = await startEncounter("user-1", 1, "enemy-42-0-1");
      expect(result.encounterId).toBeDefined();
      expect(typeof result.encounterId).toBe("string");
      expect(mockRunUpdate).toHaveBeenCalled();
    });

    it("throws SUMMARY_PENDING when state has summary", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: { ...baseRun, stateJson: { version: 1, log: [], summary: { outcome: "WIN", enemy: {}, delta: {}, loot: [], leveledUp: false } } },
      });
      await expect(startEncounter("user-1", 1, "enemy-42-0-0")).rejects.toThrow(CombatError);
      const err = await startEncounter("user-1", 1, "enemy-42-0-0").catch((e) => e);
      expect(err.code).toBe("SUMMARY_PENDING");
      expect(err.status).toBe(400);
    });

    it("throws ENCOUNTER_ACTIVE when state has encounter", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            encounter: { encounterId: "e1", enemy: {}, enemyHp: 10, enemyHpMax: 10 },
            log: [],
          },
        },
      });
      await expect(startEncounter("user-1", 1, "enemy-42-0-0")).rejects.toThrow(CombatError);
      const err = await startEncounter("user-1", 1, "enemy-42-0-0").catch((e) => e);
      expect(err.code).toBe("ENCOUNTER_ACTIVE");
    });

    it("throws INVALID_CHOICE when choiceId does not match", async () => {
      await expect(startEncounter("user-1", 1, "invalid-choice-id")).rejects.toThrow(CombatError);
      const err = await startEncounter("user-1", 1, "invalid-choice-id").catch((e) => e);
      expect(err.code).toBe("INVALID_CHOICE");
    });
  });

  describe("getCombat", () => {
    it("throws NO_ACTIVE_ENCOUNTER when state has no encounter", async () => {
      await expect(getCombat("user-1", 1)).rejects.toThrow(CombatError);
      const err = await getCombat("user-1", 1).catch((e) => e);
      expect(err.code).toBe("NO_ACTIVE_ENCOUNTER");
      expect(err.status).toBe(404);
    });

    it("returns combat state when encounter exists", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK",
                attack: 2,
                defense: 1,
              },
              enemyHp: 8,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await getCombat("user-1", 1);
      expect(result.slotIndex).toBe(1);
      expect(result.encounterId).toBe("enc-1");
      expect(result.player.hp).toBe(20);
      expect(result.enemy.name).toBe("Goblin");
      expect(result.canHeal).toBe(false);
    });

    it("returns canHeal true when run has potions", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK",
                attack: 2,
                defense: 1,
              },
              enemyHp: 8,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      mockRunInventoryItemFindMany.mockResolvedValue([
        {
          id: "inv-potion-1",
          runId,
          itemCatalogId: "cat-potion",
          quantity: 2,
          itemCatalog: { id: "cat-potion", itemType: "POTION", name: "Potion", attackBonus: 0, defenseBonus: 0, healPercent: 25, sellValueCoins: 2 },
        },
      ]);
      const result = await getCombat("user-1", 1);
      expect(result.canHeal).toBe(true);
    });
  });

  describe("getSummary", () => {
    it("throws NO_SUMMARY when state has no summary", async () => {
      await expect(getSummary("user-1", 1)).rejects.toThrow(CombatError);
      const err = await getSummary("user-1", 1).catch((e) => e);
      expect(err.code).toBe("NO_SUMMARY");
      expect(err.status).toBe(404);
    });

    it("returns summary when pending summary exists", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            log: [],
            summary: {
              outcome: "WIN",
              enemy: { name: "Goblin", species: "Beast", level: 1 },
              delta: { xpGained: 10, coinsGained: 5, hpChange: 0 },
              loot: [],
              leveledUp: false,
            },
          },
        },
      });
      const result = await getSummary("user-1", 1);
      expect(result.slotIndex).toBe(1);
      expect(result.outcome).toBe("WIN");
      expect(result.enemy.name).toBe("Goblin");
    });

    it("returns summary with newLevel when leveledUp is true", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            log: [],
            summary: {
              outcome: "WIN",
              enemy: { name: "Orc", species: "Humanoid", level: 2 },
              delta: { xpGained: 20, coinsGained: 10, hpChange: 20 },
              loot: [],
              leveledUp: true,
              newLevel: 2,
            },
          },
        },
      });
      const result = await getSummary("user-1", 1);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });
  });

  describe("ackSummary", () => {
    it("clears summary and returns status and inventory", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: { ...baseRun, stateJson: { version: 1, log: [], summary: {} } },
      });
      const result = await ackSummary("user-1", 1);
      expect(result.status).toBeDefined();
      expect(result.inventory).toEqual([]);
      expect(mockRunUpdate).toHaveBeenCalled();
      expect(mockGetGameStatus).toHaveBeenCalledWith("user-1", 1);
      expect(mockGetInventory).toHaveBeenCalledWith("user-1", 1);
    });
  });

  describe("applyAction", () => {
    it("throws NO_ACTIVE_ENCOUNTER when no encounter", async () => {
      await expect(applyAction("user-1", 1, "ATTACK")).rejects.toThrow(CombatError);
      const err = await applyAction("user-1", 1, "ATTACK").catch((e) => e);
      expect(err.code).toBe("NO_ACTIVE_ENCOUNTER");
    });

    it("throws SUMMARY_PENDING when summary exists", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "e1",
              enemy: { choiceId: "e", name: "G", species: "B", level: 1, tier: "WEAK" as const, attack: 1, defense: 0 },
              enemyHp: 10,
              enemyHpMax: 10,
            },
            log: [],
            summary: { outcome: "WIN" as const, enemy: {}, delta: {}, loot: [], leveledUp: false },
          },
        },
      });
      await expect(applyAction("user-1", 1, "ATTACK")).rejects.toThrow(CombatError);
      const err = await applyAction("user-1", 1, "ATTACK").catch((e) => e);
      expect(err.code).toBe("SUMMARY_PENDING");
    });

    it("returns outcome and updates run when ATTACK continues combat", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 20,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 1,
              },
              enemyHp: 100,
              enemyHpMax: 100,
            },
            log: [{ t: "2025-01-01T00:00:00.000Z", text: "Encounter started." }],
          },
        },
      });
      const result = await applyAction("user-1", 1, "ATTACK");
      expect(["CONTINUE", "WIN", "DEFEAT"]).toContain(result.outcome);
      expect(mockRunUpdate).toHaveBeenCalled();
    });

    it("returns WIN and runs transaction when ATTACK kills enemy (enemyHp 1)", async () => {
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 20,
          coins: 50,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 0,
              },
              enemyHp: 1,
              enemyHpMax: 10,
            },
            log: [{ t: "2025-01-01T00:00:00.000Z", text: "Encounter started." }],
          },
        },
      });
      const result = await applyAction("user-1", 1, "ATTACK");
      expect(result.outcome).toBe("WIN");
      expect(mockRunUpdate).toHaveBeenCalled();
      expect(mockTxCharacterUpdate).toHaveBeenCalled();
      expect(mockTxRunUpdate).toHaveBeenCalled();
      expect(mockTxCharacterStatsUpdate).toHaveBeenCalled();
    });

    it("WIN with loot drop runs lootWithCatalog and create path", async () => {
      mockGenerateLoot.mockReturnValueOnce({
        coinsGained: 10,
        itemDrops: [{ itemCatalogId: "cat-1", quantity: 1 }],
      });
      mockTxRunInventoryItemFindFirst.mockResolvedValueOnce(null);
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 20,
          coins: 50,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 0,
              },
              enemyHp: 1,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "ATTACK");
      expect(result.outcome).toBe("WIN");
      expect(mockTxRunInventoryItemCreate).toHaveBeenCalled();
    });

    it("WIN with loot drop and existing stack runs update path", async () => {
      mockGenerateLoot.mockReturnValueOnce({
        coinsGained: 10,
        itemDrops: [{ itemCatalogId: "cat-1", quantity: 1 }],
      });
      mockTxRunInventoryItemFindFirst.mockResolvedValueOnce({ id: "inv-existing", quantity: 2 });
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 20,
          coins: 50,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 0,
              },
              enemyHp: 1,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "ATTACK");
      expect(result.outcome).toBe("WIN");
      expect(mockTxRunInventoryItemUpdate).toHaveBeenCalled();
    });

    it("returns RETREAT and updates run and stats", async () => {
      mockCharacterStatsFindUnique.mockResolvedValue({
        totalFights: 0,
        wins: 0,
        losses: 0,
        retreats: 0,
        totalCoinsEarned: 0,
        enemiesBySpecies: {},
      });
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 20,
          coins: 100,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 1,
              },
              enemyHp: 10,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "RETREAT");
      expect(result.outcome).toBe("RETREAT");
      expect(mockRunUpdate).toHaveBeenCalled();
      expect(mockCharacterStatsUpdate).toHaveBeenCalled();
    });

    it("returns DEFEAT when player hp goes to 0 from counterattack", async () => {
      mockCharacterStatsFindUnique.mockResolvedValue({
        totalFights: 0,
        wins: 0,
        losses: 0,
        retreats: 0,
        totalCoinsEarned: 0,
        enemiesBySpecies: {},
      });
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 1,
          coins: 50,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Ogre",
                species: "Humanoid",
                level: 2,
                tier: "TOUGH" as const,
                attack: 15,
                defense: 0,
              },
              enemyHp: 100,
              enemyHpMax: 100,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "ATTACK");
      expect(result.outcome).toBe("DEFEAT");
      expect(mockRunUpdate).toHaveBeenCalled();
      expect(mockCharacterStatsUpdate).toHaveBeenCalled();
    });

    it("HEAL consumes potion and updates run hp", async () => {
      const potionRow = {
        id: "inv-potion-1",
        runId,
        itemCatalogId: "cat-potion",
        quantity: 1,
        itemCatalog: { id: "cat-potion", itemType: "POTION" as const, name: "Potion", attackBonus: 0, defenseBonus: 0, healPercent: 25, sellValueCoins: 2 },
      };
      mockRunInventoryItemFindMany.mockResolvedValue([potionRow]);
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 10,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 1,
              },
              enemyHp: 10,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "HEAL");
      expect(result.outcome).toBe("CONTINUE");
      expect(mockRunUpdate).toHaveBeenCalled();
      expect(mockTxRunInventoryItemDelete).toHaveBeenCalled();
    });

    it("HEAL with quantity > 1 decrements potion stack", async () => {
      const potionRow = {
        id: "inv-potion-1",
        runId,
        itemCatalogId: "cat-potion",
        quantity: 3,
        itemCatalog: { id: "cat-potion", itemType: "POTION" as const, name: "Potion", attackBonus: 0, defenseBonus: 0, healPercent: 25, sellValueCoins: 2 },
      };
      mockRunInventoryItemFindMany.mockResolvedValue([potionRow]);
      mockRequireRunForSlot.mockResolvedValue({
        character: baseRun.character,
        run: {
          ...baseRun,
          hp: 15,
          turnCounter: 0,
          stateJson: {
            version: 1,
            encounter: {
              encounterId: "enc-1",
              enemy: {
                choiceId: "e-1",
                name: "Goblin",
                species: "Beast",
                level: 1,
                tier: "WEAK" as const,
                attack: 2,
                defense: 1,
              },
              enemyHp: 10,
              enemyHpMax: 10,
            },
            log: [],
          },
        },
      });
      const result = await applyAction("user-1", 1, "HEAL");
      expect(result.outcome).toBe("CONTINUE");
      expect(mockTxRunInventoryItemUpdate).toHaveBeenCalled();
    });

  });
});
