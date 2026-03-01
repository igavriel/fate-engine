import { requireAuth } from "@/server/auth/requireAuth";
import { getEnemies } from "@/server/game/enemies";
import { GameError } from "@/server/game/requireRunForSlot";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, errorResponse, json, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

async function getEnemiesHandler(request: Request) {
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
    const result = await getEnemies(userId, slotIndex);
    log.info({ event: "get_enemies" }, "get_enemies");
    return json(result);
  } catch (err) {
    if (err instanceof GameError) return errorResponse(err.code, err.message, err.status);
    throw err;
  }
}

export const GET = withRequestLogging(getEnemiesHandler);
