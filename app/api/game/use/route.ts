import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { getInventory, consumePotionItem } from "@/server/game/inventoryService";
import { GameError } from "@/server/game/requireRunForSlot";
import { useItemBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import {
  badRequest,
  errorResponse,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postUseHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, useItemBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { slotIndex, inventoryItemId } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    await consumePotionItem(userId, slotIndex as 1 | 2 | 3, inventoryItemId);
    const [status, inventory] = await Promise.all([
      getGameStatus(userId, slotIndex as 1 | 2 | 3),
      getInventory(userId, slotIndex as 1 | 2 | 3),
    ]);
    log.info({ event: "use_item" }, "use_item");
    return ok({ status, inventory }, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "ITEM_NOT_FOUND") return notFound("Item not found", traceId);
    if (msg === "NOT_A_POTION") return badRequest("Item is not a potion", undefined, traceId);
    return serverError("Failed to use item", traceId);
  }
}

export const POST = withRequestLogging(postUseHandler);
