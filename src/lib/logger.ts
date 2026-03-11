type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const MAX_BUFFER_SIZE = 50;
const logBuffer: LogEntry[] = [];

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

function pushEntry(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  if (process.env.NODE_ENV === "development") {
    const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
    // eslint-disable-next-line no-console
    console[method](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context ?? "");
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    pushEntry(createEntry("info", message, context));
  },

  warn(message: string, context?: Record<string, unknown>) {
    pushEntry(createEntry("warn", message, context));
  },

  error(message: string, context?: Record<string, unknown>) {
    pushEntry(createEntry("error", message, context));
  },

  getRecentLogs(): readonly LogEntry[] {
    return logBuffer;
  },
};
