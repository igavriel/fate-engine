import pino from "pino";
import { env } from "@/server/env/env";

export const logger =
  env.LOG_PRETTY === true
    ? pino(
        { level: env.LOG_LEVEL },
        pino.transport({ target: "pino-pretty", options: { colorize: true } })
      )
    : pino({ level: env.LOG_LEVEL });

export function withTraceId(traceId: string) {
  return logger.child({ traceId });
}

/**
 * Returns a child logger with traceId bound. Use for request-scoped logging.
 */
export function createRequestLogger(traceId: string) {
  return logger.child({ traceId });
}
