type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: LogLevel[] = ["debug", "info", "warn", "error"];

const envLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel) {
  return levelOrder.indexOf(level) >= levelOrder.indexOf(envLevel);
}

export function log(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  const payload = meta ? { message, meta } : { message };
  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}]`, payload);
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};

