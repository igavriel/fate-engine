import { json } from "@/server/http/respond";
import { withRequestLogging } from "@/server/http/withRequestLogging";

async function getHealth(_request: Request) {
  return json({
    status: "ok",
    ts: new Date().toISOString(),
  });
}

export const GET = withRequestLogging(getHealth);
