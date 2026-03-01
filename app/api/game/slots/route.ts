import { requireAuth } from "@/server/auth/requireAuth";
import { listSlots } from "@/server/game/slots";
import { json, unauthorized } from "@/server/http/respond";

export async function GET(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const slots = await listSlots(userId);
  return json(slots);
}
