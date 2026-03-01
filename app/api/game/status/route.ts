import { requireAuth } from "@/server/auth/requireAuth";
import { getGameStatus } from "@/server/game/status";
import { slotIndexQuerySchema } from "@/shared/zod/game";
import { badRequest, json, notFound, unauthorized } from "@/server/http/respond";

export async function GET(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return unauthorized();

  const url = new URL(request.url);
  const parsed = slotIndexQuerySchema.safeParse({
    slotIndex: url.searchParams.get("slotIndex") ?? "",
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid slotIndex");
  }

  const status = await getGameStatus(userId, parsed.data.slotIndex as 1 | 2 | 3);
  if (!status) return notFound("Slot not found or empty");

  return json(status);
}
