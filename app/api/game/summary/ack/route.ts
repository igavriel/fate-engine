import { requireAuth } from "@/server/auth/requireAuth";
import { ackSummary } from "@/server/game/combatService";
import { GameError } from "@/server/game/requireRunForSlot";
import { summaryAckBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postSummaryAckHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized(undefined, getTraceId(request));

  const parsed = await parseJson(request, summaryAckBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error, undefined, getTraceId(request));
  }

  const { slotIndex } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await ackSummary(userId, slotIndex as 1 | 2 | 3);
    log.info({ event: "summary_ack" }, "summary_ack");
    return ok(result, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    throw err;
  }
}

export const POST = withRequestLogging(postSummaryAckHandler);
