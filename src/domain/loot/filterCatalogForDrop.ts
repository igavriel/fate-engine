/**
 * Level-aware item filtering for drops.
 * Filters catalog by player level (requiredLevel), bracket preference, and tier power cap.
 */

import { getLevelBracket } from "@/domain/items/levelBrackets";
import type { EnemyTier } from "@/shared/zod/game";

export interface CatalogItemForFilter {
  id: string;
  itemType: "WEAPON" | "ARMOR" | "POTION";
  attackBonus: number;
  defenseBonus: number;
  healPercent: number;
  requiredLevel: number;
  powerScore: number;
}

/** Tier power caps: WEAK = low, NORMAL = mid, ELITE = highest. */
export const BRACKET_POWER_CAP_BY_TIER: Record<EnemyTier, number> = {
  WEAK: 2,
  NORMAL: 3,
  ELITE: 5,
};

export interface FilterCatalogForDropInput {
  catalogItems: CatalogItemForFilter[];
  playerLevel: number;
  tier: EnemyTier;
}

/**
 * Returns items eligible to drop for the given player level and tier.
 * - Base: requiredLevel <= playerLevel
 * - Prefer: requiredLevel in [bracketMin, playerLevel]
 * - Tier: powerScore <= bracketPowerCap for tier
 *
 * Fallbacks (in order):
 * 1. If bracket+tier filter is empty → allow all with requiredLevel <= playerLevel (ignore bracket).
 * 2. If still empty → allow all with requiredLevel <= playerLevel (ignore tier cap).
 * 3. If still empty → return entire catalog (defensive).
 */
export function filterCatalogForDrop(input: FilterCatalogForDropInput): CatalogItemForFilter[] {
  const { catalogItems, playerLevel, tier } = input;
  if (catalogItems.length === 0) return [];

  const { bracketMin, bracketMax } = getLevelBracket(playerLevel);
  const powerCap = BRACKET_POWER_CAP_BY_TIER[tier];

  const levelEligible = catalogItems.filter((i) => i.requiredLevel <= playerLevel);
  if (levelEligible.length === 0) return catalogItems;

  const inBracket = levelEligible.filter(
    (i) => i.requiredLevel >= bracketMin && i.requiredLevel <= playerLevel
  );
  const inBracketAndTier = inBracket.filter((i) => i.powerScore <= powerCap);

  if (inBracketAndTier.length > 0) return inBracketAndTier;

  const tierOnly = levelEligible.filter((i) => i.powerScore <= powerCap);
  if (tierOnly.length > 0) return tierOnly;

  return levelEligible;
}
