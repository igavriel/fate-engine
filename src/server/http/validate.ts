import type { z } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Parse request body as JSON and validate with Zod schema.
 * Use for POST/PUT request bodies.
 */
export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<ParseJsonResult<z.infer<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON" };
  }
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data as z.infer<T> };
  }
  const first = result.error.issues[0];
  const message = first ? `${first.path.join(".") || "body"}: ${first.message}` : "Validation failed";
  return { success: false, error: message };
}
