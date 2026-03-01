import { prisma } from "@/server/db/prisma";
import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import { computeEffectiveStats } from "@/domain/stats/computeEffectiveStats";
import type { GameStatusResponse } from "@/shared/zod/game";

export async function getGameStatus(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<GameStatusResponse> {
  const { character: char, run } = await requireRunForSlot(userId, slotIndex);

  const equipment = await prisma.runEquipment.findUnique({
    where: { runId: run.id },
    include: {
      weaponInventoryItem: { include: { itemCatalog: true } },
      armorInventoryItem: { include: { itemCatalog: true } },
    },
  });

  const baseStats = {
    attack: char.baseAttack,
    defense: char.baseDefense,
    luck: char.baseLuck,
    hpMax: char.baseHpMax,
  };

  const weaponBonus = equipment?.weaponInventoryItem?.itemCatalog
    ? { attackBonus: equipment.weaponInventoryItem.itemCatalog.attackBonus }
    : null;
  const armorBonus = equipment?.armorInventoryItem?.itemCatalog
    ? { defenseBonus: equipment.armorInventoryItem.itemCatalog.defenseBonus }
    : null;
  const effectiveStats = computeEffectiveStats(baseStats, weaponBonus, armorBonus);

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
        weapon: equipment?.weaponInventoryItemId ?? null,
        armor: equipment?.armorInventoryItemId ?? null,
      },
      lastOutcome: run.lastOutcome,
    },
  };
}
