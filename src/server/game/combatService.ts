import { prisma } from "@/server/db/prisma";
import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import { getRunState, type RunStateJson, type RunStateSummary } from "@/server/game/runState";
import { getGameStatus } from "@/server/game/status";
import { getInventory } from "@/server/game/inventoryService";
import { computeEffectiveStats } from "@/domain/stats/computeEffectiveStats";
import { generateEnemyChoices } from "@/domain/enemies/generateEnemyChoices";
import { startEncounter as domainStartEncounter } from "@/domain/combat/startEncounter";
import { resolveCombatAction, type CombatActionType } from "@/domain/combat/resolveCombatAction";
import { xpGainedForKill, addXp, applyLevelUps } from "@/domain/progression/xp";
import { computeLevelUpGrowth } from "@/domain/progression/levelUp";
import { generateLoot } from "@/domain/loot/generateLoot";
import type {
  StartEncounterResponse,
  CombatStateResponse,
  ActionResponse,
  SummaryResponse,
  SummaryAckResponse,
} from "@/shared/zod/game";
import { randomUUID } from "crypto";

const HEAL_PERCENT = 25;

export class CombatError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 404 | 409
  ) {
    super(message);
    this.name = "CombatError";
  }
}

export async function startEncounter(
  userId: string,
  slotIndex: 1 | 2 | 3,
  choiceId: string
): Promise<StartEncounterResponse> {
  const { character, run } = await requireRunForSlot(userId, slotIndex);
  const state = getRunState(run.stateJson);

  if (state.summary) {
    throw new CombatError("SUMMARY_PENDING", "Acknowledge the previous combat summary first", 409);
  }
  if (state.encounter) {
    throw new CombatError("ENCOUNTER_ACTIVE", "An encounter is already active", 409);
  }

  const choices = generateEnemyChoices({
    seed: run.seed,
    fightCounter: run.fightCounter,
    playerLevel: character.level,
  });
  const chosen = choices.find((c) => c.choiceId === choiceId);
  if (!chosen) {
    throw new CombatError("INVALID_CHOICE", "choiceId does not match any current enemy", 400);
  }

  const encounterId = randomUUID();
  const result = domainStartEncounter({
    seed: run.seed,
    fightCounter: run.fightCounter,
    playerLevel: character.level,
    chosenEnemy: chosen,
    encounterId,
    now: new Date().toISOString(),
  });

  const newState: RunStateJson = {
    version: 1,
    encounter: {
      encounterId: result.encounterId,
      enemy: result.enemy,
      enemyHp: result.enemyHp,
      enemyHpMax: result.enemyHpMax,
    },
    log: [result.initialLogEntry],
    summary: null,
  };

  await prisma.run.update({
    where: { id: run.id },
    data: {
      fightCounter: result.nextFightCounter,
      stateJson: newState as unknown as object,
    },
  });

  return { encounterId: result.encounterId };
}

export async function getCombat(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<CombatStateResponse> {
  const { character, run } = await requireRunForSlot(userId, slotIndex);
  const state = getRunState(run.stateJson);

  if (!state.encounter) {
    throw new CombatError("NO_ACTIVE_ENCOUNTER", "No active encounter", 404);
  }

  const equipment = await prisma.runEquipment.findUnique({
    where: { runId: run.id },
    include: {
      weaponInventoryItem: { include: { itemCatalog: true } },
      armorInventoryItem: { include: { itemCatalog: true } },
    },
  });
  const baseStats = {
    attack: character.baseAttack,
    defense: character.baseDefense,
    luck: character.baseLuck,
    hpMax: character.baseHpMax,
  };
  const weaponBonus = equipment?.weaponInventoryItem?.itemCatalog
    ? { attackBonus: equipment.weaponInventoryItem.itemCatalog.attackBonus }
    : null;
  const armorBonus = equipment?.armorInventoryItem?.itemCatalog
    ? { defenseBonus: equipment.armorInventoryItem.itemCatalog.defenseBonus }
    : null;
  const effectiveStats = computeEffectiveStats(baseStats, weaponBonus, armorBonus);

  const potions = await prisma.runInventoryItem.findMany({
    where: { runId: run.id },
    include: { itemCatalog: true },
  });
  const potionCount = potions
    .filter((p) => p.itemCatalog.itemType === "POTION")
    .reduce((sum, p) => sum + p.quantity, 0);

  return {
    slotIndex,
    encounterId: state.encounter.encounterId,
    player: {
      hp: run.hp,
      hpMax: character.baseHpMax,
      effectiveAttack: effectiveStats.attack,
      effectiveDefense: effectiveStats.defense,
      luck: effectiveStats.luck,
    },
    enemy: {
      name: state.encounter.enemy.name,
      species: state.encounter.enemy.species,
      level: state.encounter.enemy.level,
      hp: state.encounter.enemyHp,
      hpMax: state.encounter.enemyHpMax,
    },
    log: state.log,
    canHeal: potionCount > 0,
  };
}

export async function applyAction(
  userId: string,
  slotIndex: 1 | 2 | 3,
  type: CombatActionType
): Promise<ActionResponse> {
  const { character, run } = await requireRunForSlot(userId, slotIndex);
  const state = getRunState(run.stateJson);

  if (run.status === "OVER") {
    throw new CombatError("RUN_OVER", "Run has ended", 409);
  }
  if (state.summary) {
    throw new CombatError("SUMMARY_PENDING", "Acknowledge the previous combat summary first", 409);
  }
  if (!state.encounter) {
    throw new CombatError("NO_ACTIVE_ENCOUNTER", "No active encounter", 404);
  }

  const equipment = await prisma.runEquipment.findUnique({
    where: { runId: run.id },
    include: {
      weaponInventoryItem: { include: { itemCatalog: true } },
      armorInventoryItem: { include: { itemCatalog: true } },
    },
  });
  const baseStats = {
    attack: character.baseAttack,
    defense: character.baseDefense,
    luck: character.baseLuck,
    hpMax: character.baseHpMax,
  };
  const weaponBonus = equipment?.weaponInventoryItem?.itemCatalog
    ? { attackBonus: equipment.weaponInventoryItem.itemCatalog.attackBonus }
    : null;
  const armorBonus = equipment?.armorInventoryItem?.itemCatalog
    ? { defenseBonus: equipment.armorInventoryItem.itemCatalog.defenseBonus }
    : null;
  const effectiveStats = computeEffectiveStats(baseStats, weaponBonus, armorBonus);

  const potions = await prisma.runInventoryItem.findMany({
    where: { runId: run.id },
    include: { itemCatalog: true },
  });
  const potionRows = potions.filter((p) => p.itemCatalog.itemType === "POTION");
  const canHeal = potionRows.some((p) => p.quantity >= 1);

  const resolveResult = resolveCombatAction({
    seed: run.seed,
    turnCounter: run.turnCounter,
    playerHp: run.hp,
    playerHpMax: character.baseHpMax,
    playerAttack: effectiveStats.attack,
    playerDefense: effectiveStats.defense,
    playerLuck: effectiveStats.luck,
    playerCoins: run.coins,
    encounter: {
      enemy: state.encounter.enemy,
      enemyHp: state.encounter.enemyHp,
    },
    action: type,
    canHeal,
    healPercent: HEAL_PERCENT,
  });

  let newHp = run.hp + resolveResult.hpDelta;
  if (resolveResult.healIntent) {
    const healAmount = resolveResult.healIntent.healAmount;
    newHp = Math.min(character.baseHpMax, run.hp + healAmount);
    const potionItem = potionRows.find((p) => p.quantity >= 1);
    if (!potionItem) {
      throw new CombatError("NO_POTION", "No potion available", 400);
    }
    await prisma.$transaction(async (tx) => {
      if (potionItem.quantity === 1) {
        await tx.runInventoryItem.delete({ where: { id: potionItem.id } });
      } else {
        await tx.runInventoryItem.update({
          where: { id: potionItem.id },
          data: { quantity: potionItem.quantity - 1 },
        });
      }
    });
  }

  const newCoins = run.coins + resolveResult.coinsDelta;
  const newLog = [...state.log, resolveResult.logEntry];

  let nextState: RunStateJson;
  const runUpdate: {
    hp: number;
    coins: number;
    turnCounter: number;
    lastOutcome?: string;
    stateJson: object;
  } = {
    hp: Math.max(0, newHp),
    coins: Math.max(0, newCoins),
    turnCounter: resolveResult.nextTurnCounter,
    stateJson: {
      version: 1,
      encounter: {
        ...state.encounter,
        enemyHp: resolveResult.enemyHpAfter,
      },
      log: newLog,
      summary: null,
    } as unknown as object,
  };

  if (resolveResult.outcome !== "CONTINUE") {
    runUpdate.lastOutcome = resolveResult.outcome;
    nextState = {
      version: 1,
      log: newLog,
      summary: null,
    };

    const enemySnapshot = state.encounter.enemy;
    let summaryData: RunStateSummary;

    if (resolveResult.outcome === "WIN") {
      const xpGain = xpGainedForKill(enemySnapshot.level);
      const totalXp = addXp(character.xp, character.level, xpGain);
      const levelResult = applyLevelUps(totalXp, character.level);
      const catalogIds = (await prisma.itemCatalog.findMany({ select: { id: true } })).map(
        (c) => c.id
      );
      const lootResult = generateLoot({
        seed: run.seed,
        fightCounter: run.fightCounter - 1,
        enemyLevel: enemySnapshot.level,
        enemyTier: enemySnapshot.tier,
        catalogIds,
      });

      let level = character.level;
      let baseAttack = character.baseAttack;
      let baseDefense = character.baseDefense;
      let baseLuck = character.baseLuck;
      let baseHpMax = character.baseHpMax;

      for (let i = 0; i < levelResult.levelsGained; i++) {
        level += 1;
        const growth = computeLevelUpGrowth({
          seed: run.seed,
          newLevel: level,
          species: character.species as "HUMAN" | "DWARF" | "ELF" | "MAGE",
        });
        baseAttack += growth.statDelta.attack;
        baseDefense += growth.statDelta.defense;
        baseLuck += growth.statDelta.luck;
        baseHpMax += growth.statDelta.hpMax;
      }
      const finalHp =
        levelResult.levelsGained > 0 ? baseHpMax : Math.min(character.baseHpMax, newHp);

      await prisma.$transaction(async (tx) => {
        await tx.character.update({
          where: { id: character.id },
          data: {
            level,
            xp: levelResult.remainingXp,
            baseAttack,
            baseDefense,
            baseLuck,
            baseHpMax,
          },
        });
        await tx.run.update({
          where: { id: run.id },
          data: {
            hp: finalHp,
            coins: run.coins + lootResult.coinsGained,
            turnCounter: resolveResult.nextTurnCounter,
            lastOutcome: "WIN",
            stateJson: { version: 1, log: newLog, summary: null } as object,
          },
        });
        for (const drop of lootResult.itemDrops) {
          const existing = await tx.runInventoryItem.findFirst({
            where: { runId: run.id, itemCatalogId: drop.itemCatalogId },
          });
          if (existing) {
            await tx.runInventoryItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + drop.quantity },
            });
          } else {
            await tx.runInventoryItem.create({
              data: { runId: run.id, itemCatalogId: drop.itemCatalogId, quantity: drop.quantity },
            });
          }
        }
        const stats = await tx.characterStats.findUnique({
          where: { characterId: character.id },
        });
        if (stats) {
          const speciesCount = (stats.enemiesBySpecies as Record<string, number>) ?? {};
          speciesCount[enemySnapshot.species] = (speciesCount[enemySnapshot.species] ?? 0) + 1;
          await tx.characterStats.update({
            where: { characterId: character.id },
            data: {
              totalFights: stats.totalFights + 1,
              wins: stats.wins + 1,
              totalCoinsEarned: stats.totalCoinsEarned + lootResult.coinsGained,
              enemiesBySpecies: speciesCount,
              lastFightSummary: {
                outcome: "WIN",
                enemy: {
                  name: enemySnapshot.name,
                  species: enemySnapshot.species,
                  level: enemySnapshot.level,
                },
                xpGained: xpGain,
                coinsGained: lootResult.coinsGained,
              } as object,
            },
          });
        }
      });

      const lootWithCatalog = await Promise.all(
        lootResult.itemDrops.map(async (d) => {
          const catalog = await prisma.itemCatalog.findUnique({
            where: { id: d.itemCatalogId },
          });
          return {
            name: catalog?.name ?? "Unknown",
            itemType: catalog?.itemType ?? "POTION",
            quantity: d.quantity,
            attackBonus: catalog?.attackBonus,
            defenseBonus: catalog?.defenseBonus,
            healPercent: catalog?.healPercent,
          };
        })
      );

      summaryData = {
        outcome: "WIN",
        enemy: {
          name: enemySnapshot.name,
          species: enemySnapshot.species,
          level: enemySnapshot.level,
        },
        delta: {
          xpGained: xpGain,
          coinsGained: lootResult.coinsGained,
          hpChange: finalHp - run.hp,
        },
        loot: lootWithCatalog,
        leveledUp: levelResult.levelsGained > 0,
        newLevel: levelResult.levelsGained > 0 ? level : undefined,
      };
    } else if (resolveResult.outcome === "RETREAT") {
      await prisma.run.update({
        where: { id: run.id },
        data: {
          hp: newHp,
          coins: newCoins,
          turnCounter: resolveResult.nextTurnCounter,
          lastOutcome: "RETREAT",
          stateJson: { version: 1, log: newLog, summary: null } as object,
        },
      });
      const stats = await prisma.characterStats.findUnique({
        where: { characterId: character.id },
      });
      if (stats) {
        await prisma.characterStats.update({
          where: { characterId: character.id },
          data: {
            totalFights: stats.totalFights + 1,
            retreats: stats.retreats + 1,
            lastFightSummary: {
              outcome: "RETREAT",
              enemy: {
                name: enemySnapshot.name,
                species: enemySnapshot.species,
                level: enemySnapshot.level,
              },
            } as object,
          },
        });
      }
      summaryData = {
        outcome: "RETREAT",
        enemy: {
          name: enemySnapshot.name,
          species: enemySnapshot.species,
          level: enemySnapshot.level,
        },
        delta: { xpGained: 0, coinsGained: resolveResult.coinsDelta, hpChange: 0 },
        loot: [],
        leveledUp: false,
      };
    } else {
      // Defeat: run is over (no recovery when we persist DEFEAT)
      await prisma.run.update({
        where: { id: run.id },
        data: {
          hp: 0,
          coins: run.coins,
          turnCounter: resolveResult.nextTurnCounter,
          lastOutcome: "DEFEAT",
          status: "OVER",
          stateJson: { version: 1, log: newLog, summary: null } as object,
        },
      });
      const stats = await prisma.characterStats.findUnique({
        where: { characterId: character.id },
      });
      if (stats) {
        await prisma.characterStats.update({
          where: { characterId: character.id },
          data: {
            totalFights: stats.totalFights + 1,
            losses: stats.losses + 1,
            lastFightSummary: {
              outcome: "DEFEAT",
              enemy: {
                name: enemySnapshot.name,
                species: enemySnapshot.species,
                level: enemySnapshot.level,
              },
            } as object,
          },
        });
      }
      summaryData = {
        outcome: "DEFEAT",
        enemy: {
          name: enemySnapshot.name,
          species: enemySnapshot.species,
          level: enemySnapshot.level,
        },
        delta: { xpGained: 0, coinsGained: 0, hpChange: -run.hp },
        loot: [],
        leveledUp: false,
      };
    }

    nextState.summary = summaryData;
    await prisma.run.update({
      where: { id: run.id },
      data: { stateJson: nextState as unknown as object },
    });
  } else {
    runUpdate.stateJson = {
      version: 1,
      encounter: {
        ...state.encounter,
        enemyHp: resolveResult.enemyHpAfter,
      },
      log: newLog,
      summary: null,
    } as unknown as object;
    await prisma.run.update({
      where: { id: run.id },
      data: runUpdate,
    });
  }

  return { outcome: resolveResult.outcome };
}

export async function getSummary(userId: string, slotIndex: 1 | 2 | 3): Promise<SummaryResponse> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const state = getRunState(run.stateJson);

  if (!state.summary) {
    throw new CombatError("NO_SUMMARY", "No pending combat summary", 404);
  }

  return {
    slotIndex,
    outcome: state.summary.outcome,
    enemy: state.summary.enemy,
    delta: state.summary.delta,
    loot: state.summary.loot,
    leveledUp: state.summary.leveledUp,
    newLevel: state.summary.newLevel,
  };
}

export async function ackSummary(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<SummaryAckResponse> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const state = getRunState(run.stateJson);

  if (!state.summary) {
    throw new CombatError("NO_SUMMARY", "No pending combat summary", 404);
  }

  const newState: RunStateJson = {
    version: 1,
    log: state.log,
    summary: null,
  };
  await prisma.run.update({
    where: { id: run.id },
    data: { stateJson: newState as unknown as object },
  });

  const [status, inventory] = await Promise.all([
    getGameStatus(userId, slotIndex),
    getInventory(userId, slotIndex),
  ]);

  return { status, inventory };
}
