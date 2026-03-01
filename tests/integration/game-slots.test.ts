import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "@/app/api/game/slots/route";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { slotsResponseSchema } from "@/shared/zod/game";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

describe("GET /api/game/slots", () => {
  let testUserId: string;
  let authCookie: string;

  beforeAll(async () => {
    if (!hasRealDb) return;
    const email = `slots-test-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    testUserId = user.id;
    const token = signToken({ sub: user.id, email: user.email });
    authCookie = `fe_auth=${encodeURIComponent(token)}`;
  });

  it("returns 401 when not authenticated", async () => {
    const res = await GET(new Request("http://localhost/api/game/slots"));
    expect(res.status).toBe(401);
  });

  it("returns 3 slots when authenticated and DB is available", async () => {
    if (!hasRealDb) {
      return;
    }
    const res = await GET(
      new Request("http://localhost/api/game/slots", {
        headers: { Cookie: authCookie },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    const parsed = slotsResponseSchema.safeParse(data);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slots).toHaveLength(3);
      expect(parsed.data.slots.map((s) => s.slotIndex)).toEqual([1, 2, 3]);
    }
  });
});
