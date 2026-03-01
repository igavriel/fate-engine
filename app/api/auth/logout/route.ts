import { clearAuthCookie } from "@/server/auth/cookies";
import { withRequestLogging } from "@/server/http/withRequestLogging";
import { NextResponse } from "next/server";

async function postLogout(_request: Request) {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearAuthCookie());
  return response;
}

export const POST = withRequestLogging(postLogout);
