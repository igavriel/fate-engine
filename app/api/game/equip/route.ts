import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { getInventory, equipItem } from "@/server/game/inventoryService";
import { GameError } from "@/server/game/requireRunForSlot";
import { equipBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, notFound, ok, serverError, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postEquipHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, equipBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { slotIndex, equipmentSlot, inventoryItemId } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    await equipItem(userId, slotIndex as 1 | 2 | 3, equipmentSlot, inventoryItemId);
    const [status, inventory] = await Promise.all([
      getGameStatus(userId, slotIndex as 1 | 2 | 3),
      getInventory(userId, slotIndex as 1 | 2 | 3),
    ]);
    log.info({ event: "equip" }, "equip");
    return ok({ status, inventory }, 200, traceId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    if (msg === "ITEM_NOT_FOUND") return notFound("Item not found", traceId);
    if (msg === "EQUIPMENT_NOT_FOUND") return notFound("Equipment not found", traceId);
    return serverError("Failed to equip", traceId);
  }
}

export const POST = withRequestLogging(postEquipHandler);
