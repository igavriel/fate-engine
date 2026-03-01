import { getTraceId, runWithTraceId } from "@/server/http/trace";
import { createRequestLogger } from "@/server/log/logger";
import { serverError } from "@/server/http/respond";

type RouteHandler = (
  request: Request,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<Response>;

/**
 * Wraps a route handler to:
 * - Set trace ID in async context (reuse x-trace-id or generate UUID)
 * - Log request summary: traceId, route, method, status, durationMs
 * - Attach x-trace-id to response
 * - On throw: log error with traceId and stack (server-only), return 500 without leaking stack
 */
export function withRequestLogging(handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: { params?: Promise<Record<string, string>> }) => {
    return runWithTraceId(request, async () => {
      const traceId = getTraceId(request);
      const start = Date.now();
      const route = new URL(request.url).pathname;
      const method = request.method;
      const log = createRequestLogger(traceId);

      try {
        const response = await handler(request, context);
        const durationMs = Date.now() - start;
        const status = response.status;
        log.info(
          { route, method, status, durationMs },
          "request"
        );
        return addTraceIdToResponse(response, traceId);
      } catch (err) {
        const durationMs = Date.now() - start;
        log.error(
          { route, method, durationMs, err, stack: err instanceof Error ? err.stack : undefined },
          "request_error"
        );
        return serverError("Internal server error");
      }
    });
  };
}

function addTraceIdToResponse(response: Response, traceId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-trace-id", traceId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
