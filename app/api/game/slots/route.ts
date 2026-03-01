import { requireAuth } from "@/server/auth/requireAuth";
import { listSlots } from "@/server/game/slots";
import { getTraceId } from "@/server/http/trace";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { json, unauthorized } from "@/server/http/respond";
import { createRequestLogger } from "@/server/log/logger";

async function getSlots(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const traceId = getTraceId(request);
  const log = createRequestLogger(traceId).child({ userId });
  const slots = await listSlots(userId);
  log.info({ event: "list_slots" }, "list_slots");
  return json(slots);
}

export const GET = withRequestLogging(getSlots);
