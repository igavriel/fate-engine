import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { getInventory, sellItemFromInventory } from "@/server/game/inventoryService";
import { GameError } from "@/server/game/requireRunForSlot";
import { sellItemBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, notFound, ok, serverError, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postSellHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, sellItemBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { slotIndex, inventoryItemId } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    await sellItemFromInventory(userId, slotIndex as 1 | 2 | 3, inventoryItemId);
    const [status, inventory] = await Promise.all([
      getGameStatus(userId, slotIndex as 1 | 2 | 3),
      getInventory(userId, slotIndex as 1 | 2 | 3),
    ]);
    log.info({ event: "sell_item" }, "sell_item");
    return ok({ status, inventory }, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "ITEM_NOT_FOUND") return notFound("Item not found", traceId);
    if (msg === "CANNOT_SELL_EQUIPPED") return badRequest("Cannot sell equipped item", undefined, traceId);
    return serverError("Failed to sell item", traceId);
  }
}

export const POST = withRequestLogging(postSellHandler);
