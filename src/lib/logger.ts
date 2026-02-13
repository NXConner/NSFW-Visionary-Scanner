// Structured logging utility for production monitoring
import * as Sentry from "@sentry/react";

type LogLevel = "debug" | "info" | "warn" | "error";
type UnknownRecord = Record<string, unknown>;

interface LogContext extends UnknownRecord {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: UnknownRecord;
  [key: string]: unknown; // Allow additional properties
}

type ConsoleMethod = "debug" | "info" | "warn" | "error" | "log";

// Capture a stable reference to the *original* console before any interception.
const rawConsole: Pick<Console, ConsoleMethod> = {
  debug: globalThis.console?.debug?.bind(globalThis.console) ?? (() => {}),
  info: globalThis.console?.info?.bind(globalThis.console) ?? (() => {}),
  warn: globalThis.console?.warn?.bind(globalThis.console) ?? (() => {}),
  error: globalThis.console?.error?.bind(globalThis.console) ?? (() => {}),
  log: globalThis.console?.log?.bind(globalThis.console) ?? (() => {}),
};

const DEFAULT_REDACT_KEYS = [
  "password",
  "pass",
  "pwd",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "authorization",
  "cookie",
  "set-cookie",
  "apikey",
  "api_key",
  "secret",
  "private_key",
  "service_role",
  "service_role_key",
  "supabase_service_role_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "session",
  "sessionid",
  "session_id",
];

const looksLikeJwt = (value: string): boolean =>
  /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(value);

const looksLikeStripeKey = (value: string): boolean => /^sk_(live|test)_[A-Za-z0-9]+$/.test(value);
const looksLikeStripeWebhookSecret = (value: string): boolean => /^whsec_[A-Za-z0-9]+$/.test(value);

const looksLikeSupabaseKey = (value: string): boolean => /^eyJ[A-Za-z0-9\-_]+\./.test(value); // typical JWT-like

const redactString = (value: string): string => {
  // Keep short strings readable; redact likely secrets aggressively.
  if (looksLikeStripeKey(value) || looksLikeStripeWebhookSecret(value) || looksLikeJwt(value))
    return "[REDACTED]";
  if (looksLikeSupabaseKey(value) && value.length > 40) return "[REDACTED]";
  return value;
};

const redactByKey = (key: string, value: unknown, redactKeys: string[]): unknown => {
  const k = key.toLowerCase();
  if (redactKeys.some(rk => k.includes(rk))) return "[REDACTED]";
  if (typeof value === "string") return redactString(value);
  return value;
};

const safeSerialize = (value: unknown, redactKeys: string[]): unknown => {
  try {
    if (value == null) return value;
    if (typeof value === "string") return redactString(value);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (value instanceof Error) {
      return {
        name: value.name,
        message: redactString(value.message),
        stack: value.stack,
      };
    }
    if (Array.isArray(value)) return value.map(v => safeSerialize(v, redactKeys));
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = safeSerialize(redactByKey(k, v, redactKeys), redactKeys);
      }
      return out;
    }
    return String(value);
  } catch {
    return "[Unserializable]";
  }
};

class Logger {
  private isProduction = import.meta.env.PROD;
  private appVersion = import.meta.env.VITE_APP_VERSION || "unknown";
  private envName =
    import.meta.env.VITE_APP_ENV || (this.isProduction ? "production" : "development");
  private redactKeys = DEFAULT_REDACT_KEYS;

  setRedactKeys(keys: string[]) {
    this.redactKeys = Array.from(new Set(keys.map(k => k.toLowerCase())));
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = safeSerialize(context, this.redactKeys) as UnknownRecord | undefined;

    const logEntry: UnknownRecord = {
      timestamp,
      level,
      message: redactString(message),
      version: this.appVersion,
      environment: this.envName,
      ...(sanitizedContext ?? {}),
    };

    if (this.isProduction) {
      this.sendToMonitoring(logEntry);
    } else {
      const consoleMethod: ConsoleMethod =
        level === "debug"
          ? "debug"
          : level === "warn"
            ? "warn"
            : level === "error"
              ? "error"
              : "log";
      rawConsole[consoleMethod](`[${level.toUpperCase()}] ${message}`, context ?? "");
    }
  }

  private sendToMonitoring(logEntry: UnknownRecord) {
    // Primary: Sentry (errors + breadcrumbs). Safe to call even if not initialized.
    try {
      const level = String(logEntry.level || "info");
      const msg = String(logEntry.message || "");
      const extra: Record<string, unknown> = { ...logEntry };
      delete extra.message;
      delete extra.level;

      if (level === "error") {
        // If an Error object was passed through as metadata/error, preserve it for grouping when possible.
        const directError = logEntry.error instanceof Error ? logEntry.error : undefined;
        const meta = (
          logEntry.metadata && typeof logEntry.metadata === "object"
            ? (logEntry.metadata as Record<string, unknown>)
            : undefined
        ) as Record<string, unknown> | undefined;
        const metaError = meta?.error instanceof Error ? (meta.error as Error) : undefined;
        const maybeError = directError ?? metaError;
        if (maybeError) {
          Sentry.captureException(maybeError, { extra });
        } else {
          Sentry.captureMessage(msg, { level: "error", extra });
        }
      } else {
        // Breadcrumb-level noise should not flood events.
        Sentry.addBreadcrumb({
          level: level === "warn" ? "warning" : level === "debug" ? "debug" : "info",
          message: msg,
          data: extra,
          category: String(logEntry.component || "app"),
        });
      }
    } catch {
      // Never throw from logging.
    }

    // Secondary: dataLayer (if present) for analytics-based sinks.
    try {
      const w = window as unknown as { dataLayer?: { push: (evt: UnknownRecord) => void } };
      if (typeof window !== "undefined" && w.dataLayer) {
        w.dataLayer.push({
          event: "log_event",
          log_level: String(logEntry.level),
          log_message: String(logEntry.message),
          ...logEntry,
        });
      }
    } catch {
      // ignore
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }
  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }
  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  // Specialized logging methods for common events
  userAction(action: string, userId?: string, metadata?: UnknownRecord) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      component: "user_interaction",
      metadata,
    });
  }

  apiCall(endpoint: string, method: string, status: number, duration: number, userId?: string) {
    this.info(`API call: ${method} ${endpoint}`, {
      userId,
      component: "api",
      action: "http_request",
      metadata: { endpoint, method, status, duration },
    });
  }

  scanEvent(eventType: "start" | "complete" | "error", userId?: string, metadata?: UnknownRecord) {
    this.info(`Scan ${eventType}`, {
      userId,
      component: "scanner",
      action: `scan_${eventType}`,
      metadata,
    });
  }

  errorBoundary(error: Error, componentStack?: string, userId?: string) {
    this.error("React Error Boundary caught an error", {
      userId,
      component: "error_boundary",
      metadata: {
        error,
        componentStack,
      },
    });
  }
}

export const logger = new Logger();

export function installConsoleInterceptor(options?: {
  enabled?: boolean;
  minLevel?: LogLevel;
  redactKeys?: string[];
}) {
  const enabled = options?.enabled ?? import.meta.env.PROD;
  if (!enabled) return;

  if (options?.redactKeys) logger.setRedactKeys(options.redactKeys);

  const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  const minLevel = options?.minLevel ?? "info";
  const min = levelOrder[minLevel];

  const route = (level: LogLevel, args: unknown[]) => {
    if (levelOrder[level] < min) return;
    const msg = args
      .map(a =>
        typeof a === "string"
          ? a
          : (() => {
              try {
                return JSON.stringify(safeSerialize(a, DEFAULT_REDACT_KEYS));
              } catch {
                return String(a);
              }
            })(),
      )
      .join(" ");
    logger[level](msg);
  };

  // Patch console methods (preserving original bindings via rawConsole).
  globalThis.console.debug = (...args: unknown[]) => route("debug", args);
  globalThis.console.info = (...args: unknown[]) => route("info", args);
}
