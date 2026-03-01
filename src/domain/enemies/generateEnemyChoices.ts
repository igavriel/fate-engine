import type { EnemyChoice, EnemyTier } from "@/shared/zod/game";
import { createRng } from "@/domain/rng/createRng";

const TIER_MODIFIER: Record<EnemyTier, number> = {
  WEAK: -1,
  NORMAL: 0,
  TOUGH: 1,
};

const TIER_WEIGHT: Record<EnemyTier, number> = {
  WEAK: 1,
  NORMAL: 2,
  TOUGH: 3,
};

const ENEMY_NAMES = [
  "Goblin",
  "Orc",
  "Skeleton",
  "Wolf",
  "Spider",
  "Bat",
  "Rat",
  "Slime",
  "Bandit",
  "Cultist",
  "Wraith",
  "Imp",
  "Harpy",
  "Troll",
  "Ogre",
];

const ENEMY_SPECIES = ["Beast", "Undead", "Humanoid", "Demon", "Elemental", "Construct"];

const TIERS: EnemyTier[] = ["WEAK", "NORMAL", "TOUGH"];

export interface GenerateEnemyInput {
  seed: number;
  fightCounter: number;
  playerLevel: number;
}

/**
 * Generate 3 deterministic enemy choices (WEAK, NORMAL, TOUGH).
 * Does not mutate fightCounter (preview only in Phase 1A).
 */
export function generateEnemyChoices(input: GenerateEnemyInput): EnemyChoice[] {
  const { seed, fightCounter, playerLevel } = input;
  // Use seed + fightCounter so each "fight position" has stable but distinct names/species
  const rng = createRng(seed + fightCounter * 1000);

  return TIERS.map((tier, index) => {
    const tierMod = TIER_MODIFIER[tier];
    const level = Math.max(1, playerLevel + tierMod);
    const tierWeight = TIER_WEIGHT[tier];
    const base = level * tierWeight;
    const estimatedLootCoinsMin = base * 2;
    const estimatedLootCoinsMax = base * 4;

    // Deterministic name/species from tier index and RNG sequence
    const name = rng.pick(ENEMY_NAMES);
    const species = rng.pick(ENEMY_SPECIES);
    const choiceId = `enemy-${seed}-${fightCounter}-${index}`;

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
