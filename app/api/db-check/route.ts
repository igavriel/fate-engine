import { prisma } from "@/server/db/prisma";
import { json, serverError } from "@/server/http/respond";

export async function GET() {
  try {
    const now = new Date().toISOString();
    await prisma.appConfig.upsert({
      where: { key: "last_db_check" },
      create: { key: "last_db_check", value: now },
      update: { value: now },
    });
    return json({
      status: "ok",
      db: "connected",
      updatedKey: "last_db_check",
    });
  } catch {
    return serverError("Database connection failed");
  }
}
