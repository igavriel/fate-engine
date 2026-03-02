/**
 * Run.stateJson shape for combat.
 * See docs/03-domain-rules.md for full schema.
 */

import type { EnemyTier } from "@/shared/zod/game";

export interface RunStateEncounterEnemy {
  choiceId: string;
  name: string;
  species: string;
  level: number;
  tier: EnemyTier;
  attack: number;
  defense: number;
}

export interface RunStateEncounter {
  encounterId: string;
  enemy: RunStateEncounterEnemy;
  enemyHp: number;
  enemyHpMax: number;
}

export interface RunStateLogEntry {
  t: string;
  text: string;
}

/** Maximum combat log entries kept in stateJson and returned by getCombat. */
export const COMBAT_LOG_MAX_ENTRIES = 50;

/** Returns the last `max` log entries, preserving order. */
export function capCombatLog(
  log: RunStateLogEntry[],
  max: number = COMBAT_LOG_MAX_ENTRIES
): RunStateLogEntry[] {
  return log.length <= max ? log : log.slice(-max);
}

export interface RunStateSummaryLootItem {
  name: string;
  itemType: "WEAPON" | "ARMOR" | "POTION";
  quantity: number;
  attackBonus?: number;
  defenseBonus?: number;
  healPercent?: number;
  requiredLevel?: number;
}

export interface RunStateSummary {
  outcome: "WIN" | "RETREAT" | "DEFEAT";
  enemy: { name: string; species: string; level: number };
  delta: { xpGained: number; coinsGained: number; hpChange: number };
  loot: RunStateSummaryLootItem[];
  leveledUp: boolean;
  newLevel?: number;
}

export interface RunStateJson {
  version: 1;
  encounter?: RunStateEncounter;
  log: RunStateLogEntry[];
  summary?: RunStateSummary | null;
}

const DEFAULT_STATE: RunStateJson = {
  version: 1,
  log: [],
};

export function getRunState(stateJson: unknown): RunStateJson {
  if (stateJson == null || typeof stateJson !== "object") {
    return { ...DEFAULT_STATE };
  }
  const s = stateJson as Record<string, unknown>;
  return {
    version: (s.version as 1) ?? 1,
    encounter: s.encounter as RunStateEncounter | undefined,
    log: Array.isArray(s.log) ? (s.log as RunStateLogEntry[]) : [],
    summary: s.summary as RunStateSummary | null | undefined,
  };
}
