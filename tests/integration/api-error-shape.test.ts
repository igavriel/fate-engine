import { describe, it, expect, beforeAll } from "vitest";
import { GET as getStatus } from "@/app/api/game/status/route";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { zApiError } from "@/shared/zod/common";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

describe("API error shape and x-trace-id", () => {
  let authCookie: string;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `error-shape-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    const token = signToken({ sub: user.id, email: user.email });
    authCookie = `fe_auth=${encodeURIComponent(token)}`;
  });

  it("invalid slotIndex returns 400, body matches zApiError, and x-trace-id header exists", async () => {
    if (!hasRealDb) return;
    const res = await getStatus(
      new Request("http://localhost/api/game/status?slotIndex=99", {
        headers: { Cookie: authCookie },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    const parsed = zApiError.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBeDefined();
      expect(parsed.data.error.message).toBeDefined();
    }
    const traceId = res.headers.get("x-trace-id");
    expect(traceId).toBeTruthy();
    expect(typeof traceId).toBe("string");
  });
});
