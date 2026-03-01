import { requireAuth } from "@/server/auth/requireAuth";
import { startEncounter, CombatError } from "@/server/game/combatService";
import { GameError } from "@/server/game/requireRunForSlot";
import { startEncounterBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postStartEncounterHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized(undefined, getTraceId(request));

  const parsed = await parseJson(request, startEncounterBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error, undefined, getTraceId(request));
  }

  const { slotIndex, choiceId } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await startEncounter(userId, slotIndex as 1 | 2 | 3, choiceId);
    log.info({ event: "encounter_start", encounterId: result.encounterId }, "encounter_start");
    return ok(result, 200, traceId);
  } catch (err) {
    if (err instanceof CombatError) return errorResponse(err.code, err.message, err.status, traceId);
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    throw err;
  }
}

export const POST = withRequestLogging(postStartEncounterHandler);
