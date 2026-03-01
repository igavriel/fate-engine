import { requireAuth } from "@/server/auth/requireAuth";
import { getCombat, CombatError } from "@/server/game/combatService";
import { GameError } from "@/server/game/requireRunForSlot";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, ok, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

export const runtime = "nodejs";

async function getCombatHandler(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized(undefined, getTraceId(request));

  const url = new URL(request.url);
  const parsed = slotIndexQuerySchema.safeParse({
    slotIndex: url.searchParams.get("slotIndex") ?? "",
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid slotIndex", undefined, getTraceId(request));
  }

  const slotIndex = parsed.data.slotIndex as 1 | 2 | 3;
  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId, slotIndex });

  try {
    const result = await getCombat(userId, slotIndex);
    log.info({ event: "get_combat", encounterId: result.encounterId }, "get_combat");
    return ok(result, 200, traceId);
  } catch (err) {
    if (err instanceof CombatError) return errorResponse(err.code, err.message, err.status, traceId);
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status, traceId);
    throw err;
  }
}

export const GET = withRequestLogging(getCombatHandler);
