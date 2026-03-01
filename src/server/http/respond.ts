import { NextResponse } from "next/server";
import { errorPayload } from "@/shared/zod/common";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json(errorPayload("BAD_REQUEST", message, details), { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(errorPayload("UNAUTHORIZED", message), { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json(errorPayload("NOT_FOUND", message), { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json(errorPayload("INTERNAL_ERROR", message), { status: 500 });
}
