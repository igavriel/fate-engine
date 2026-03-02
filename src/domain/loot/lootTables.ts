/**
 * Deterministic loot tables.
 * Coins and item drop chance are driven by enemy tier, level, run seed, and fightCounter.
 * Same inputs => same outputs (no per-request randomness).
 */

import { createRng } from "@/domain/rng/createRng";
import type { EnemyTier } from "@/shared/zod/game";
import { filterCatalogForDrop, type CatalogItemForFilter } from "@/domain/loot/filterCatalogForDrop";
import { selectDropItem, type CatalogItemForLoot } from "./selectDropItem";

/** Coin multiplier by tier. WEAK: more coins / fewer items; ELITE: slightly lower coins, higher item chance. */
export const COIN_TIER_MULTIPLIER: Record<EnemyTier, number> = {
  WEAK: 1.2,
  NORMAL: 1.0,
  ELITE: 1.4,
};

/** Drop chance threshold (roll <= X => drop). Higher tier = higher chance. */
export const DROP_CHANCE_THRESHOLD: Record<EnemyTier, number> = {
  WEAK: 65,
  NORMAL: 70,
  ELITE: 85,
};

/** Offset so loot RNG stream is distinct from encounter/action streams. */
const LOOT_RNG_OFFSET = 2000;

export interface LootTablesInput {
  seed: number;
  fightCounter: number;
  enemyLevel: number;
  enemyTier: EnemyTier;
  playerLevel: number;
  catalogItems: CatalogItemForFilter[];
}

export interface ItemDrop {
  itemCatalogId: string;
  quantity: number;
}

export interface LootTablesResult {
  coinsGained: number;
  itemDrops: ItemDrop[];
}

/**
 * Deterministic loot: coins from level/tier; optionally one item from catalog.
 * Catalog is filtered by player level and tier (filterCatalogForDrop) before selection.
 * rng = createRng(seed + fightCounter + LOOT_RNG_OFFSET).
 */
export function computeLoot(input: LootTablesInput): LootTablesResult {
  const { seed, fightCounter, enemyLevel, enemyTier, playerLevel, catalogItems } = input;
  const rng = createRng(seed + fightCounter + LOOT_RNG_OFFSET);

  const base = enemyLevel * 5;
  const multiplier = COIN_TIER_MULTIPLIER[enemyTier];
  const coinsGained = Math.round(base * multiplier) + rng.int(0, enemyLevel);

  const eligibleItems = filterCatalogForDrop({
    catalogItems,
    playerLevel,
    tier: enemyTier,
  });

  const itemDrops: ItemDrop[] = [];
  if (eligibleItems.length > 0) {
    const roll = rng.int(1, 100);
    const threshold = DROP_CHANCE_THRESHOLD[enemyTier];
    if (roll <= threshold) {
      const drop = selectDropItem({
        rng,
        enemyTier,
        catalogItems: eligibleItems as CatalogItemForLoot[],
      });
      itemDrops.push({ itemCatalogId: drop.itemCatalogId, quantity: 1 });
    }
  }

  return { coinsGained, itemDrops };
}
