import { requireAuth } from "@/server/auth/requireAuth";
import { getEnemies } from "@/server/game/enemies";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, json, notFound, unauthorized } from "@/server/http/respond";
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

  const result = await getEnemies(userId, slotIndex);
  if (!result) return notFound("Slot not found or empty");

  log.info({ event: "get_enemies" }, "get_enemies");
  return json(result);
}

export const GET = withRequestLogging(getEnemiesHandler);
