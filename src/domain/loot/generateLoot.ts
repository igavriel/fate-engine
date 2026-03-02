import { createRng } from "@/domain/rng/createRng";

const TIER_WEIGHT: Record<string, number> = {
  WEAK: 1,
  NORMAL: 2,
  ELITE: 3,
};

export interface GenerateLootInput {
  seed: number;
  fightCounter: number;
  enemyLevel: number;
  enemyTier: string;
  /** All item catalog IDs that can drop (e.g. from ItemCatalog) */
  catalogIds: string[];
}

export interface ItemDrop {
  itemCatalogId: string;
  quantity: number;
}

export interface GenerateLootResult {
  coinsGained: number;
  itemDrops: ItemDrop[];
}

/**
 * Deterministic loot: coins from level/tier; optionally one item from catalog.
 * rng(seed + fightCounter + enemyLevel) for picks.
 */
export function generateLoot(input: GenerateLootInput): GenerateLootResult {
  const { seed, fightCounter, enemyLevel, enemyTier, catalogIds } = input;
  const tierWeight = TIER_WEIGHT[enemyTier] ?? 2;
  const base = enemyLevel * tierWeight;
  const rng = createRng(seed + fightCounter + enemyLevel * 1000);

  const coinsGained = base * 2 + rng.int(0, base);

  const itemDrops: ItemDrop[] = [];
  if (catalogIds.length > 0) {
    const roll = rng.next();
    if (roll < 0.3) {
      const itemCatalogId = rng.pick(catalogIds);
      itemDrops.push({ itemCatalogId, quantity: 1 });
    }
  }

  return { coinsGained, itemDrops };
}
