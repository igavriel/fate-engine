import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { setAuthCookie } from "@/server/auth/cookies";
import { badRequest, unauthorized } from "@/server/http/respond";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return badRequest("email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, email: user.email });
  const response = NextResponse.json({
    user: { id: user.id, email: user.email },
  });
  response.headers.set("Set-Cookie", setAuthCookie(token));
  return response;
}
