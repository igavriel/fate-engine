import { requireAuth } from "@/server/auth/requireAuth";
import { createCharacter } from "@/server/game/createCharacter";
import { createCharacterBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, json, notFound, serverError, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

async function postCreateCharacter(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, createCharacterBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const slotIndex = parsed.data.slotIndex as 1 | 2 | 3;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await createCharacter(userId, {
      slotIndex,
      name: parsed.data.name,
      species: parsed.data.species,
    });
    log.info({ event: "create_character", runId: result.runId }, "create_character");
    return json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "SLOT_NOT_FOUND") return notFound("Slot not found");
    if (msg === "SLOT_OCCUPIED") return badRequest("Slot already has a character");
    return serverError("Failed to create character");
  }
}

export const POST = withRequestLogging(postCreateCharacter);
