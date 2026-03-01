import { requireAuth } from "@/server/auth/requireAuth";
import { applyAction, CombatError } from "@/server/game/combatService";
import { GameError } from "@/server/game/requireRunForSlot";
import { actionBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postActionHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized(undefined, getTraceId(request));

  const parsed = await parseJson(request, actionBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error, undefined, getTraceId(request));
  }

  const { slotIndex, type } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await applyAction(userId, slotIndex as 1 | 2 | 3, type);
    log.info({ event: "action", type, outcome: result.outcome }, "action");
    return ok(result, 200, traceId);
  } catch (err) {
    if (err instanceof CombatError)
      return errorResponse(err.code, err.message, err.status, traceId);
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    throw err;
  }
}

export const POST = withRequestLogging(postActionHandler);
