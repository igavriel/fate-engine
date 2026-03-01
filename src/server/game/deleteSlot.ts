import { prisma } from "@/server/db/prisma";
import { GameError } from "@/server/game/requireRunForSlot";
import type { SlotsResponse } from "@/shared/zod/game";
import { listSlots } from "@/server/game/slots";

/**
 * Delete the character and run in the given slot (clear the slot). The slot row remains;
 * slot becomes empty so the user can create a new character there.
 * - Slot not found → GameError SLOT_NOT_FOUND (404)
 * - Slot already empty → GameError SLOT_EMPTY (400)
 */
export async function deleteSlot(userId: string, slotIndex: 1 | 2 | 3): Promise<SlotsResponse> {
  const slot = await prisma.saveSlot.findUnique({
    where: { userId_slotIndex: { userId, slotIndex } },
  });

  if (!slot) {
    throw new GameError("SLOT_NOT_FOUND", "Slot not found", 404);
  }

  if (slot.characterId == null || slot.runId == null) {
    throw new GameError("SLOT_EMPTY", "Slot has no character to delete", 400);
  }

  const runId = slot.runId;
  const characterId = slot.characterId;

  await prisma.$transaction(async (tx) => {
    await tx.saveSlot.update({
      where: { id: slot.id },
      data: { characterId: null, runId: null },
    });
    await tx.run.delete({ where: { id: runId } });
    await tx.character.delete({ where: { id: characterId } });
  });

  return listSlots(userId);
}
