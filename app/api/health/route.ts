import { json } from "@/server/http/respond";
import { withRequestLogging } from "@/server/http/withRequestLogging";

async function getHealth(request: Request) {
  void request;
  return json({
    status: "ok",
    ts: new Date().toISOString(),
  });
}

export const GET = withRequestLogging(getHealth);
