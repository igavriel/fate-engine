import { prisma } from "@/server/db/prisma";
import { generateEnemyChoices } from "@/domain/enemies/generateEnemyChoices";
import type { EnemiesResponse } from "@/shared/zod/game";

export async function getEnemies(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<EnemiesResponse | null> {
  const slot = await prisma.saveSlot.findUnique({
    where: { userId_slotIndex: { userId, slotIndex } },
    include: {
      run: { include: { character: true } },
    },
  });

  if (!slot || !slot.runId || !slot.run) {
    return null;
  }

  const run = slot.run;
  const playerLevel = run.character.level;

  const enemies = generateEnemyChoices({
    seed: run.seed,
    fightCounter: run.fightCounter,
    playerLevel,
  });

  return { enemies };
}
