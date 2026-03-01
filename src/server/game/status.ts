import { prisma } from "@/server/db/prisma";
import { requireRunForSlot } from "@/server/game/requireRunForSlot";
import { computeEffectiveStats } from "@/domain/stats/computeEffectiveStats";
import { computeIsRecoverable } from "@/domain/run/isRecoverable";
import type { GameStatusResponse } from "@/shared/zod/game";

export async function getGameStatus(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<GameStatusResponse> {
  const { character: char, run } = await requireRunForSlot(userId, slotIndex);

  const [equipment, potionRows] = await Promise.all([
    prisma.runEquipment.findUnique({
      where: { runId: run.id },
      include: {
        weaponInventoryItem: { include: { itemCatalog: true } },
        armorInventoryItem: { include: { itemCatalog: true } },
      },
    }),
    prisma.runInventoryItem.findMany({
      where: { runId: run.id },
      include: { itemCatalog: true },
    }),
  ]);

  const hasPotion = potionRows.some(
    (r: { itemCatalog: { itemType: string }; quantity: number }) =>
      r.itemCatalog.itemType === "POTION" && r.quantity >= 1
  );
  const isRecoverable = computeIsRecoverable(run.hp, hasPotion);

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

  const runStatus = run.status as "ACTIVE" | "OVER";

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
      status: runStatus,
      isRecoverable,
    },
  };
}

/**
 * End the current run for a slot: set run.status = OVER.
 * SaveSlot.runId is kept so the hub can still fetch status and show "run over".
 * Losses are only incremented on combat DEFEAT (not here); this endpoint is idempotent.
 */
export async function endRun(
  userId: string,
  slotIndex: 1 | 2 | 3
): Promise<GameStatusResponse> {
  const { run } = await requireRunForSlot(userId, slotIndex);

  await prisma.run.update({
    where: { id: run.id },
    data: { status: "OVER" },
  });

  return getGameStatus(userId, slotIndex);
}
