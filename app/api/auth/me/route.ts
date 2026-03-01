import { prisma } from "@/server/db/prisma";
import { getAuthCookie } from "@/server/auth/cookies";
import { verifyToken } from "@/server/auth/jwt";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { json, unauthorized } from "@/server/http/respond";

async function getMe(request: Request) {
  const token = getAuthCookie(request);
  if (!token) return unauthorized();

  const payload = verifyToken(token);
  if (!payload) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, createdAt: true },
  });
  if (!user) return unauthorized();

  return json({ user });
}

export const GET = withRequestLogging(getMe);
