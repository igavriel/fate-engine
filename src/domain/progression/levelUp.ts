import { createRng } from "@/domain/rng/createRng";
import type { Species } from "@/shared/zod/game";

export interface BaseStatsDelta {
  attack: number;
  defense: number;
  luck: number;
  hpMax: number;
}

/** Species bias: which stat gets a bonus on level up (deterministic from seed + newLevel) */
const SPECIES_BIAS: Record<Species, (keyof BaseStatsDelta)[]> = {
  HUMAN: ["attack", "defense", "luck", "hpMax"],
  DWARF: ["defense", "hpMax", "attack", "luck"],
  ELF: ["luck", "attack", "defense", "hpMax"],
  MAGE: ["attack", "luck", "defense", "hpMax"],
};

export interface LevelUpInput {
  seed: number;
  newLevel: number;
  species: Species;
}

export interface LevelUpResult {
  statDelta: BaseStatsDelta;
  /** MVP: full heal on level up */
  fullHeal: true;
}

/**
 * Compute deterministic stat growth for a level up. Uses rng(seed + newLevel).
 * One stat gets +2 (species bias), others +1.
 */
export function computeLevelUpGrowth(input: LevelUpInput): LevelUpResult {
  const { seed, newLevel, species } = input;
  const rng = createRng(seed + newLevel);
  const biasOrder = SPECIES_BIAS[species];
  const favoredIndex = rng.int(0, biasOrder.length - 1);
  const favoredStat = biasOrder[favoredIndex]!;

  const statDelta: BaseStatsDelta = {
    attack: 1,
    defense: 1,
    luck: 1,
    hpMax: 2,
  };
  statDelta[favoredStat] = (statDelta[favoredStat] ?? 0) + 1;

  return {
    statDelta,
    fullHeal: true,
  };
}
