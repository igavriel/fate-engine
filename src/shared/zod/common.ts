import { z } from "zod";

/** Standard API error shape (for validation of responses) */
export const zApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

/** Standard API error shape */
export const errorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const errorResponseSchema = z.object({
  error: errorDetailSchema,
});

export type ErrorDetail = z.infer<typeof errorDetailSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type SlotIndex = 1 | 2 | 3;

export function errorPayload(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error: { code, message, ...(details && { details }) },
  };
}
