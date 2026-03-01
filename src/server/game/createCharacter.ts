import { prisma } from "@/server/db/prisma";
import type { CreateCharacterResponse } from "@/shared/zod/game";
import type { Species } from "@/shared/zod/game";
import { createRng } from "@/domain/rng/createRng";

const SPECIES_BASELINE: Record<
  Species,
  { attack: number; defense: number; luck: number; hpMax: number }
> = {
  HUMAN: { attack: 5, defense: 5, luck: 5, hpMax: 20 },
  DWARF: { attack: 6, defense: 7, luck: 3, hpMax: 24 },
  ELF: { attack: 6, defense: 4, luck: 7, hpMax: 18 },
  MAGE: { attack: 7, defense: 3, luck: 6, hpMax: 16 },
};

function getSpeciesBaseline(species: Species) {
  return SPECIES_BASELINE[species];
}

/** Deterministic modifier in [-1, 1] per stat from seed */
function getSeedModifiers(seed: number): {
  attack: number;
  defense: number;
  luck: number;
  hpMax: number;
} {
  const rng = createRng(seed);
  return {
    attack: rng.int(-1, 1),
    defense: rng.int(-1, 1),
    luck: rng.int(-1, 1),
    hpMax: rng.int(-2, 2),
  };
}

export async function createCharacter(
  userId: string,
  params: { slotIndex: 1 | 2 | 3; name: string; species: Species }
): Promise<CreateCharacterResponse> {
  const { slotIndex, name, species } = params;

  const slot = await prisma.saveSlot.findUnique({
    where: { userId_slotIndex: { userId, slotIndex } },
  });
  if (!slot) {
    throw new Error("SLOT_NOT_FOUND");
  }
  if (slot.characterId) {
    throw new Error("SLOT_OCCUPIED");
  }

  const runSeed = Math.floor(Math.random() * 0x7fffffff) + 1;
  const base = getSpeciesBaseline(species);
  const mod = getSeedModifiers(runSeed);

  const character = await prisma.character.create({
    data: {
      userId,
      name: name.trim(),
      species,
      level: 1,
      xp: 0,
      baseAttack: Math.max(0, base.attack + mod.attack),
      baseDefense: Math.max(0, base.defense + mod.defense),
      baseLuck: Math.max(0, base.luck + mod.luck),
      baseHpMax: Math.max(1, base.hpMax + mod.hpMax),
    },
  });

  const run = await prisma.run.create({
    data: {
      userId,
      characterId: character.id,
      seed: runSeed,
      fightCounter: 0,
      turnCounter: 0,
      hp: character.baseHpMax,
      coins: 0,
      lastOutcome: "NONE",
    },
  });

  await prisma.characterStats.create({
    data: {
      characterId: character.id,
    },
  });

  await prisma.runEquipment.create({
    data: { runId: run.id },
  });

  await prisma.saveSlot.update({
    where: { id: slot.id },
    data: { characterId: character.id, runId: run.id },
  });

  return {
    slotIndex,
    characterId: character.id,
    runId: run.id,
  };
}
