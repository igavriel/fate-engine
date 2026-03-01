import { prisma } from "@/server/db/prisma";
import type { GameStatusResponse } from "@/shared/zod/game";

export async function getGameStatus(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<GameStatusResponse | null> {
  const slot = await prisma.saveSlot.findUnique({
    where: { userId_slotIndex: { userId, slotIndex } },
    include: {
      run: {
        include: {
          character: true,
        },
      },
    },
  });

  if (!slot || !slot.runId || !slot.run || !slot.characterId) {
    return null;
  }

  const run = slot.run;
  const char = run.character;

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
