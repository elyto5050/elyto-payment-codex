import { logger } from "@/lib/logger";

type MonitoringContext = Record<string, unknown>;

export function captureException(error: unknown, context?: MonitoringContext) {
  logger.error("Captured exception", {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    ...context
  });

  if (process.env.SENTRY_DSN) {
    // Sentry-ready hook: integrate @sentry/nextjs and call Sentry.captureException here
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: MonitoringContext) {
  if (level === "warning") logger.warn(message, context);
  else if (level === "error") logger.error(message, context);
  else logger.info(message, context);

  if (process.env.SENTRY_DSN) {
    // Sentry-ready hook: Sentry.captureMessage(message, level)
  }
}
