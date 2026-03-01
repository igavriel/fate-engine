import { requireAuth } from "@/server/auth/requireAuth";
import { getEnemies } from "@/server/game/enemies";
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

  const result = await getEnemies(userId, parsed.data.slotIndex as 1 | 2 | 3);
  if (!result) return notFound("Slot not found or empty");

  return json(result);
}
