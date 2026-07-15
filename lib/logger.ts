type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /(token|secret|password|cookie|jwt|authorization|refresh|access[_-]?token|id[_-]?token|session)/i;
const LOCAL_LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m"
};
const RESET = "\x1b[0m";

function maskValue(value: unknown) {
  if (typeof value !== "string") return "[REDACTED]";
  if (value.length <= 8) return "[REDACTED]";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveValues(entry));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack
    };
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? maskValue(entry) : redactSensitiveValues(entry)
      ])
    );
  }

  return value;
}

function normalizeContext(context: LogContext = {}) {
  return redactSensitiveValues(context) as LogContext;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (level === "debug" && process.env.LOG_LEVEL !== "debug" && process.env.NODE_ENV === "production") {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...normalizeContext(context)
  };

  const isProduction = process.env.NODE_ENV === "production";
  const line = isProduction
    ? JSON.stringify(payload)
    : `${LOCAL_LOG_COLORS[level]}${payload.timestamp} ${level.toUpperCase()} ${message}${RESET} ${JSON.stringify(normalizeContext(context))}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function createLogger(defaultContext: LogContext = {}) {
  return {
    debug: (message: string, context?: LogContext) => write("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) => write("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) => write("warn", message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) => write("error", message, { ...defaultContext, ...context })
  };
}

export const logger = createLogger();
