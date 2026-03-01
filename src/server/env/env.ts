import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  LOG_PRETTY: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v === "true" || v === "1"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function parse(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Env validation failed: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

export const env = parse();

/** Only for tests: clear cache so parse() can be re-run (e.g. to cover cached branch). */
export function __testingClearEnvCache(): void {
  cached = null;
}
