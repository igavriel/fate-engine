import { requireAuth } from "@/server/auth/requireAuth";
import { createCharacter } from "@/server/game/createCharacter";
import { createCharacterBodySchema } from "@/shared/zod/game";
import { parseJson } from "@/server/http/validate";
import { badRequest, json, notFound, serverError, unauthorized } from "@/server/http/respond";

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, createCharacterBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  try {
    const result = await createCharacter(userId, {
      slotIndex: parsed.data.slotIndex as 1 | 2 | 3,
      name: parsed.data.name,
      species: parsed.data.species,
    });
    return json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "SLOT_NOT_FOUND") return notFound("Slot not found");
    if (msg === "SLOT_OCCUPIED") return badRequest("Slot already has a character");
    return serverError("Failed to create character");
  }
}
