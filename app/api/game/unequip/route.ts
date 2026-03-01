import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { getInventory, unequipItem } from "@/server/game/inventoryService";
import { GameError } from "@/server/game/requireRunForSlot";
import { unequipBodySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { parseJson } from "@/server/http/validate";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, notFound, ok, serverError, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function postUnequipHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const parsed = await parseJson(request, unequipBodySchema);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { slotIndex, equipmentSlot } = parsed.data;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    await unequipItem(userId, slotIndex as 1 | 2 | 3, equipmentSlot);
    const [status, inventory] = await Promise.all([
      getGameStatus(userId, slotIndex as 1 | 2 | 3),
      getInventory(userId, slotIndex as 1 | 2 | 3),
    ]);
    log.info({ event: "unequip" }, "unequip");
    return ok({ status, inventory }, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "EQUIPMENT_NOT_FOUND") return notFound("Equipment not found", traceId);
    return serverError("Failed to unequip", traceId);
  }
}

export const POST = withRequestLogging(postUnequipHandler);
