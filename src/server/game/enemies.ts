import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import { generateEnemyChoices } from "@/domain/enemies/generateEnemyChoices";
import type { EnemiesResponse } from "@/shared/zod/game";

/** Read-only: does not increment fightCounter or mutate run state. */
export async function getEnemies(userId: string, slotIndex: 1 | 2 | 3): Promise<EnemiesResponse> {
  const { run } = await requireRunForSlot(userId, slotIndex);
  const playerLevel = run.character.level;

  const enemies = generateEnemyChoices({
    seed: run.seed,
    fightCounter: run.fightCounter,
    playerLevel,
  });

  return { enemies };
}
