/**
 * Phase 2B: Deterministic item selection for loot drops.
 * Filters catalog by tier (power cap), then picks item type and specific item from same RNG stream.
 */

import type { Rng } from "@/domain/rng/createRng";
import type { EnemyTier } from "@/shared/zod/game";

export interface CatalogItemForLoot {
  id: string;
  itemType: "WEAPON" | "ARMOR" | "POTION";
  attackBonus: number;
  defenseBonus: number;
  healPercent: number;
}

/** Max power score allowed per tier. WEAK: small items; NORMAL: mid; ELITE: larger. */
export const MAX_POWER_BY_TIER: Record<EnemyTier, number> = {
  WEAK: 2,
  NORMAL: 3,
  ELITE: 5,
};

/** Item type weights: 50% weapon, 35% armor, 15% potion. Order: WEAPON, ARMOR, POTION. */
const TYPE_WEIGHTS = [50, 35, 15] as const;
const TYPES = ["WEAPON", "ARMOR", "POTION"] as const;
type ItemTypeForLoot = (typeof TYPES)[number];

function powerScore(item: CatalogItemForLoot): number {
  if (item.itemType === "POTION") {
    return Math.ceil(item.healPercent / 25);
  }
  return Math.max(item.attackBonus, item.defenseBonus);
}

function filterByTier(
  catalogItems: CatalogItemForLoot[],
  tier: EnemyTier
): CatalogItemForLoot[] {
  const maxPower = MAX_POWER_BY_TIER[tier];
  const filtered = catalogItems.filter((i) => powerScore(i) <= maxPower);
  return filtered.length > 0 ? filtered : catalogItems;
}

function filterByType(
  items: CatalogItemForLoot[],
  itemType: ItemTypeForLoot
): CatalogItemForLoot[] {
  return items.filter((i) => i.itemType === itemType);
}

/**
 * Choose item type deterministically: roll 1-100, then map to WEAPON (1-50), ARMOR (51-85), POTION (86-100).
 */
function chooseItemType(rng: Rng): ItemTypeForLoot {
  const roll = rng.int(1, 100);
  let acc = 0;
  for (let i = 0; i < TYPES.length; i++) {
    acc += TYPE_WEIGHTS[i];
    if (roll <= acc) return TYPES[i];
  }
  return TYPES[TYPES.length - 1];
}

export interface SelectDropItemInput {
  rng: Rng;
  enemyTier: EnemyTier;
  catalogItems: CatalogItemForLoot[];
}

export interface SelectDropItemResult {
  itemCatalogId: string;
  quantity: number;
}

/**
 * Select one item deterministically: filter by tier power cap, pick type, then pick one from filtered list.
 * Uses the provided rng (same stream as loot roll). Fallback: if no items match type filter, use entire tier-filtered list.
 */
export function selectDropItem(input: SelectDropItemInput): SelectDropItemResult {
  const { rng, enemyTier, catalogItems } = input;
  const byTier = filterByTier(catalogItems, enemyTier);
  const chosenType = chooseItemType(rng);
  const byType = filterByType(byTier, chosenType);
  const pool = byType.length > 0 ? byType : byTier;
  const item = rng.pick(pool);
  return { itemCatalogId: item.id, quantity: 1 };
}
