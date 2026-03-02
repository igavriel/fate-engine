import { NextResponse } from "next/server";

function withTraceId(response: NextResponse, traceId: string): NextResponse {
  response.headers.set("x-trace-id", traceId);
  return response;
}

/**
 * Success response: JSON body and optional x-trace-id header.
 */
export function ok<T>(data: T, status = 200, traceId?: string): NextResponse {
  const res = NextResponse.json(data, { status });
  if (traceId) withTraceId(res, traceId);
  return res;
}

/**
 * Error response: { error: { code, message, details? } } and optional x-trace-id header.
 */
export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  traceId?: string
): NextResponse {
  const body = {
    error: { code, message, ...(details !== undefined && { details }) },
  };
  const res = NextResponse.json(body, { status });
  if (traceId) withTraceId(res, traceId);
  return res;
}

/** @deprecated Use ok() for success responses. */
export function json<T>(data: T, status = 200) {
  return ok(data, status);
}

export function badRequest(message: string, details?: unknown, traceId?: string) {
  return fail("BAD_REQUEST", message, 400, details, traceId);
}

export function unauthorized(message = "Unauthorized", traceId?: string) {
  return fail("UNAUTHORIZED", message, 401, undefined, traceId);
}

export function notFound(message = "Not found", traceId?: string) {
  return fail("NOT_FOUND", message, 404, undefined, traceId);
}

export function serverError(message = "Internal server error", traceId?: string) {
  return fail("INTERNAL_ERROR", message, 500, undefined, traceId);
}

/** Return error with custom code and status (e.g. SLOT_NOT_FOUND, SLOT_EMPTY). */
export function errorResponse(
  code: string,
  message: string,
  status: 400 | 404 | 409 | 500,
  traceId?: string
): NextResponse {
  return fail(code, message, status, undefined, traceId);
}
