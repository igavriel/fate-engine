import { createRng } from "@/domain/rng/createRng";
import type { EnemyChoice, EnemyTier } from "@/shared/zod/game";

const TIER_WEIGHT: Record<EnemyTier, number> = {
  WEAK: 1,
  NORMAL: 2,
  TOUGH: 3,
};

export interface EncounterEnemySnapshot {
  choiceId: string;
  name: string;
  species: string;
  level: number;
  tier: EnemyTier;
  attack: number;
  defense: number;
}

export interface StartEncounterInput {
  seed: number;
  fightCounter: number;
  playerLevel: number;
  /** The chosen enemy from generateEnemyChoices (must match one of the current 3) */
  chosenEnemy: EnemyChoice;
  encounterId: string;
  now: string; // ISO timestamp for log
}

export interface StartEncounterResult {
  encounterId: string;
  enemy: EncounterEnemySnapshot;
  enemyHp: number;
  enemyHpMax: number;
  initialLogEntry: { t: string; text: string };
  nextFightCounter: number;
}

/**
 * Start an encounter from a chosen enemy. Deterministic: same seed, fightCounter, playerLevel, chosenEnemy => same snapshot.
 * Caller must validate that chosenEnemy is one of the current 3 choices.
 */
export function startEncounter(input: StartEncounterInput): StartEncounterResult {
  const { seed, fightCounter, chosenEnemy, encounterId, now } = input;
  const rng = createRng(seed + fightCounter);

  const tierWeight = TIER_WEIGHT[chosenEnemy.tier];
  const enemyHpMax = Math.max(10, chosenEnemy.level * 8 + rng.int(0, chosenEnemy.level * 2));
  const enemyHp = enemyHpMax;

  // Deterministic attack/defense from level and tier
  const baseAtk = chosenEnemy.level * 2 + tierWeight;
  const baseDef = chosenEnemy.level + tierWeight;
  const attack = Math.max(1, baseAtk + rng.int(-1, 2));
  const defense = Math.max(0, baseDef + rng.int(-1, 1));

  const enemy: EncounterEnemySnapshot = {
    choiceId: chosenEnemy.choiceId,
    name: chosenEnemy.name,
    species: chosenEnemy.species,
    level: chosenEnemy.level,
    tier: chosenEnemy.tier,
    attack,
    defense,
  };

  const initialLogEntry = {
    t: now,
    text: `Encounter started with ${chosenEnemy.name} (Lv.${chosenEnemy.level}).`,
  };

  return {
    encounterId,
    enemy,
    enemyHp,
    enemyHpMax,
    initialLogEntry,
    nextFightCounter: fightCounter + 1,
  };
}
