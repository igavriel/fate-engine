import { AsyncLocalStorage } from "async_hooks";

const traceStore = new AsyncLocalStorage<string>();

/**
 * Returns the trace ID for the current request.
 * Uses x-trace-id header if present, otherwise the ID set by runWithTraceId.
 * Call this from within a handler wrapped by runWithTraceId / withRequestLogging.
 */
export function getTraceId(req: Request): string {
  const header = req.headers.get("x-trace-id")?.trim();
  if (header) return header;
  const stored = traceStore.getStore();
  if (stored) return stored;
  return crypto.randomUUID();
}

/**
 * Runs fn with a trace ID in context.
 * If request has x-trace-id, that value is used; otherwise a new UUID is generated.
 * Used by withRequestLogging so that getTraceId(request) returns a stable value per request.
 */
export async function runWithTraceId<T>(request: Request, fn: () => Promise<T>): Promise<T> {
  const traceId = request.headers.get("x-trace-id")?.trim() || crypto.randomUUID();
  return traceStore.run(traceId, fn);
}
