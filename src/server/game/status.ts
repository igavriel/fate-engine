import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import type { GameStatusResponse } from "@/shared/zod/game";

export async function getGameStatus(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<GameStatusResponse> {
  const { character: char, run } = await requireRunForSlot(userId, slotIndex);

  const baseStats = {
    attack: char.baseAttack,
    defense: char.baseDefense,
    luck: char.baseLuck,
    hpMax: char.baseHpMax,
  };

  // Phase 1A: effectiveStats = baseStats; no equipment
  const effectiveStats = { ...baseStats };

  return {
    slotIndex,
    run: {
      id: run.id,
      seed: run.seed,
      level: char.level,
      xp: char.xp,
      hp: run.hp,
      hpMax: char.baseHpMax,
      coins: run.coins,
      baseStats,
      effectiveStats,
      equipped: {
        weapon: null,
        armor: null,
      },
      lastOutcome: run.lastOutcome,
    },
  };
}
