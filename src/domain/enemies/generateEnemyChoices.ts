import type { EnemyChoice, EnemyTier } from "@/shared/zod/game";
import { createRng } from "@/domain/rng/createRng";
import {
  SPECIES_LIST,
  getNamePoolForSpecies,
  type EnemySpeciesId,
} from "@/domain/enemies/enemyPools";

const TIER_MODIFIER: Record<EnemyTier, number> = {
  WEAK: -1,
  NORMAL: 0,
  ELITE: 1,
};

const TIER_WEIGHT: Record<EnemyTier, number> = {
  WEAK: 1,
  NORMAL: 2,
  ELITE: 3,
};

const TIERS: EnemyTier[] = ["WEAK", "NORMAL", "ELITE"];

export interface GenerateEnemyInput {
  seed: number;
  fightCounter: number;
  playerLevel: number;
}

/**
 * Generate 3 deterministic enemy choices (WEAK, NORMAL, ELITE).
 * Species and name are picked from enemy pools using seed + fightCounter + tierIndex.
 * Does not mutate fightCounter (preview only).
 */
export function generateEnemyChoices(input: GenerateEnemyInput): EnemyChoice[] {
  const { seed, fightCounter, playerLevel } = input;

  return TIERS.map((tier, tierIndex) => {
    const tierMod = TIER_MODIFIER[tier];
    const level = Math.max(1, playerLevel + tierMod);
    const tierWeight = TIER_WEIGHT[tier];
    const base = level * tierWeight;
    const estimatedLootCoinsMin = base * 2;
    const estimatedLootCoinsMax = base * 4;

    const speciesRng = createRng(seed + fightCounter * 1000 + tierIndex);
    const nameRng = createRng(seed + fightCounter * 1000 + tierIndex + 1000);

    const species = speciesRng.pick(SPECIES_LIST) as EnemySpeciesId;
    const namePool = getNamePoolForSpecies(species);
    const name = namePool.length > 0 ? nameRng.pick(namePool) : species;

    const choiceId = `enemy-${seed}-${fightCounter}-${tierIndex}`;

    return {
      choiceId,
      tier,
      name,
      species,
      level,
      preview: {
        estimatedLootCoinsMin,
        estimatedLootCoinsMax,
      },
    };
  });
}
