import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { getInventory } from "@/server/game/inventoryService";
import { GameError } from "@/server/game/requireRunForSlot";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function getInventoryHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const url = new URL(request.url);
  const parsed = slotIndexQuerySchema.safeParse({
    slotIndex: url.searchParams.get("slotIndex") ?? "",
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid slotIndex");
  }

  const slotIndex = parsed.data.slotIndex as 1 | 2 | 3;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const [status, inventory] = await Promise.all([
      getGameStatus(userId, slotIndex),
      getInventory(userId, slotIndex),
    ]);
    log.info({ event: "get_inventory" }, "get_inventory");
    return ok({ status, inventory }, 200, traceId);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    throw err;
  }
}

export const GET = withRequestLogging(getInventoryHandler);
