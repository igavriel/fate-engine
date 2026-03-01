import { prisma } from "@/server/db/prisma";
import { getAuthCookie } from "@/server/auth/cookies";
import { verifyToken } from "@/server/auth/jwt";

/**
 * Returns the authenticated user's id, or null if not authenticated.
 */
export async function requireAuth(request: Request): Promise<string | null> {
  const token = getAuthCookie(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true },
  });
  return user?.id ?? null;
}
