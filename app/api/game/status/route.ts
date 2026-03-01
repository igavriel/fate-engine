import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, json, notFound, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

async function getStatus(request: Request) {
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
  const status = await getGameStatus(userId, slotIndex);
  if (!status) return notFound("Slot not found or empty");

  const log = createRequestLogger(traceId).child({
    userId,
    slotIndex,
    runId: status.run.id,
  });
  log.info({ event: "get_status", runId: status.run.id }, "get_status");
  return json(status);
}

export const GET = withRequestLogging(getStatus);
