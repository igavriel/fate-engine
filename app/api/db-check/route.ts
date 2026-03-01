import { prisma } from "@/server/db/prisma";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { json, serverError } from "@/server/http/respond";

async function getDbCheck(request: Request) {
  void request;
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

export const GET = withRequestLogging(getDbCheck);
