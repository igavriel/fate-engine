import { json } from "@/server/http/respond";

export async function GET() {
  return json({
    status: "ok",
    ts: new Date().toISOString(),
  });
}
