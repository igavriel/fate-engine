/**
 * CLI script to verify DB connectivity (e.g. same DB as Vercel/Neon).
 * Run: pnpm db:check (uses .env) or pnpm env:dev -- pnpm db:check
 */
import "dotenv/config";
import { prisma } from "../src/server/db/prisma";

async function main() {
  const now = new Date().toISOString();
  await prisma.appConfig.upsert({
    where: { key: "last_db_check" },
    create: { key: "last_db_check", value: now },
    update: { value: now },
  });
  console.log("DB check OK: last_db_check updated at", now);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("DB check failed:", e);
  process.exit(1);
});
