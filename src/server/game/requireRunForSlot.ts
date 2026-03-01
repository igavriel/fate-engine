import { prisma } from "@/server/db/prisma";

/** Thrown by requireRunForSlot; routes map to { error: { code, message } } with appropriate status. */
export class GameError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 404 | 500
  ) {
    super(message);
    this.name = "GameError";
  }
}

/** Minimal slot shape returned by requireRunForSlot (characterId/runId guaranteed). */
export type RequireRunForSlotSlot = {
  id: string;
  userId: string;
  slotIndex: number;
  characterId: string;
  runId: string;
  updatedAt: Date;
};

/** Character shape returned by requireRunForSlot (matches Prisma Character). */
export type RequireRunForSlotCharacter = {
  id: string;
  userId: string;
  name: string;
  species: string;
  level: number;
  xp: number;
  baseAttack: number;
  baseDefense: number;
  baseLuck: number;
  baseHpMax: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Run shape with character (matches Prisma Run + include). */
export type RequireRunForSlotRun = {
  id: string;
  userId: string;
  characterId: string;
  seed: number;
  fightCounter: number;
  turnCounter: number;
  hp: number;
  coins: number;
  lastOutcome: string;
  stateJson: unknown;
  createdAt: Date;
  updatedAt: Date;
  character: RequireRunForSlotCharacter;
};

export type RequireRunForSlotResult = {
  slot: RequireRunForSlotSlot;
  character: RequireRunForSlotCharacter;
  run: RequireRunForSlotRun;
};

/**
 * Load slot, character, and run for a user/slot. Enforces slot/run integrity.
 * - Slot missing → GameError SLOT_NOT_FOUND (404)
 * - Slot empty (no character/run) → GameError SLOT_EMPTY (400)
 * - Character or run missing in DB → GameError DATA_INCONSISTENT (500)
 */
export async function requireRunForSlot(
  userId: string,
  slotIndex: number
): Promise<RequireRunForSlotResult> {
  const slot = await prisma.saveSlot.findUnique({
    where: { userId_slotIndex: { userId, slotIndex } },
    include: {
      run: { include: { character: true } },
    },
  });

  if (!slot) {
    throw new GameError("SLOT_NOT_FOUND", "Slot not found", 404);
  }

  if (slot.characterId == null || slot.runId == null) {
    throw new GameError("SLOT_EMPTY", "Slot has no character or run", 400);
  }

  if (!slot.run || !slot.run.character) {
    throw new GameError("DATA_INCONSISTENT", "Character or run missing for slot", 500);
  }

  return {
    slot: {
      ...slot,
      characterId: slot.characterId,
      runId: slot.runId,
    },
    character: slot.run.character,
    run: slot.run,
  };
}
