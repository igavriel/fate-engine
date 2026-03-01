import { prisma } from "@/server/db/prisma";
import type { SlotsResponse, Slot } from "@/shared/zod/game";

const SLOT_INDEXES = [1, 2, 3] as const;

export async function ensureUserSlots(userId: string): Promise<void> {
  const existing = await prisma.saveSlot.findMany({
    where: { userId },
    select: { slotIndex: true },
  });
  const existingSet = new Set(existing.map((s) => s.slotIndex));
  const missing = SLOT_INDEXES.filter((i) => !existingSet.has(i));
  if (missing.length === 0) return;

  await prisma.saveSlot.createMany({
    data: missing.map((slotIndex) => ({ userId, slotIndex })),
  });
}

export async function listSlots(userId: string): Promise<SlotsResponse> {
  await ensureUserSlots(userId);

  const rows = await prisma.saveSlot.findMany({
    where: { userId },
    orderBy: { slotIndex: "asc" },
    include: {
      character: {
        select: { id: true, name: true, species: true, level: true },
      },
    },
  });

  const slotMap = new Map(rows.map((r) => [r.slotIndex, r]));
  const slots: Slot[] = SLOT_INDEXES.map((slotIndex) => {
    const row = slotMap.get(slotIndex);
    if (!row) {
      return {
        slotIndex,
        isEmpty: true,
        character: null,
        updatedAt: null,
      };
    }
    const isEmpty = !row.characterId;
    return {
      slotIndex,
      isEmpty,
      character: row.character
        ? {
            id: row.character.id,
            name: row.character.name,
            species: row.character.species as "HUMAN" | "DWARF" | "ELF" | "MAGE",
            level: row.character.level,
          }
        : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return { slots };
}
