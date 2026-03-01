import { PrismaClient } from "@prisma/client";

/**
 * Prisma client for tests. Uses DATABASE_URL_TEST when set (e.g. isolated test DB or SQLite),
 * otherwise falls back to DATABASE_URL so integration tests can run against the same DB.
 */
const testDbUrl =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

const globalForPrismaTest = globalThis as unknown as {
  prismaTest: PrismaClient | undefined;
};

export const prismaTest =
  globalForPrismaTest.prismaTest ??
  new PrismaClient({
    datasources: { db: { url: testDbUrl } },
    log: undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaTest.prismaTest = prismaTest;
}
