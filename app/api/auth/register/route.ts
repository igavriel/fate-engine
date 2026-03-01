import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { badRequest, json, serverError } from "@/server/http/respond";

async function postRegister(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return badRequest("email and password are required");
    }
    if (password.length < 8) {
      return badRequest("password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest("email already registered");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    return json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  } catch {
    return serverError("Registration failed");
  }
}

export const POST = withRequestLogging(postRegister);
