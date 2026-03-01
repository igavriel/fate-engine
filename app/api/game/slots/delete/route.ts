import { requireAuth } from "@/server/auth/requireAuth";
import { deleteSlot } from "@/server/game/deleteSlot";
import { GameError } from "@/server/game/requireRunForSlot";
import { deleteSlotBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, serverError, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postDeleteSlotHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, deleteSlotBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { slotIndex } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await deleteSlot(userId, slotIndex as 1 | 2 | 3);
    log.info({ event: "delete_slot" }, "delete_slot");
    return ok(result, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) {
      return errorResponse(err.code, err.message, err.status, traceId);
    }
    return serverError("Failed to delete slot", traceId);
  }
}

export const POST = withRequestLogging(postDeleteSlotHandler);
