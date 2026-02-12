import * as Sentry from "@sentry/react";
import type { Metric } from "web-vitals";
import { APP_NAME } from "@/config/brand";
import { BUILD_DISTRIBUTION_CHANNEL } from "@/lib/buildFlags";

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /secret/i,
  /api[_-]?key/i,
  /session/i,
  /email/i,
  /phone/i,
  /address/i,
  /dob/i,
  /ssn/i,
  /health/i,
  /medical/i,
  /diagnosis/i,
];

const SECRET_VALUE_PATTERNS = [
  /^sk_(live|test)_[A-Za-z0-9]+$/,
  /^whsec_[A-Za-z0-9]+$/,
  /^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/,
];

const redactString = (value: string): string =>
  SECRET_VALUE_PATTERNS.some(pattern => pattern.test(value)) ? "[REDACTED]" : value;

const sanitizeTelemetryValue = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeTelemetryValue(item, seen));
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (seen.has(objectValue)) return "[Circular]";
    seen.add(objectValue);

    const out: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(objectValue)) {
      if (SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(key))) {
        out[key] = "[REDACTED]";
        continue;
      }
      out[key] = sanitizeTelemetryValue(nestedValue, seen);
    }
    return out;
  }
  return String(value);
};

// Initialize Sentry for error tracking and performance monitoring
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || "development";
  const release = `${APP_NAME}@${__APP_VERSION__}`;

  if (!dsn || environment === "development") {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 100,
    beforeSend(event) {
      return sanitizeTelemetryValue(event) as typeof event;
    },
    beforeBreadcrumb(breadcrumb) {
      return sanitizeTelemetryValue(breadcrumb) as typeof breadcrumb;
    },
  });

  // Set user context if available (with safe localStorage access)
  try {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      Sentry.setUser({ id: userId });
    }
  } catch {
    // Ignore localStorage access errors in restricted contexts
  }

  // Set tags for better error categorization
  Sentry.setTag("app_version", import.meta.env.VITE_APP_VERSION || "unknown");
  Sentry.setTag("build_version", __APP_VERSION__);
  Sentry.setTag("app_name", APP_NAME);
  Sentry.setTag("distribution_channel", BUILD_DISTRIBUTION_CHANNEL || "direct");
  Sentry.setTag("app_environment", environment);
};

// Performance monitoring helper
export const measurePerformance = async (name: string, fn: () => void | Promise<void>) => {
  return Sentry.startSpan(
    {
      name,
      op: "function",
    },
    async () => {
      try {
        const result = fn();
        if (result instanceof Promise) {
          return await result;
        }
        return result;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
  );
};

// Error boundary wrapper for React components
// Note: For JSX fallback components, create a separate .tsx file
export const withErrorBoundary = (Component: React.ComponentType, fallback?: React.ReactNode) => {
  return Sentry.withErrorBoundary(Component, { fallback: fallback as React.ReactElement });
};

// Custom error reporting
export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

export const reportError = (error: Error, context?: ErrorContext) => {
  Sentry.withScope(scope => {
    if (context) {
      // Tags must be strings; also attach context as "extra" for richer debugging.
      for (const [key, value] of Object.entries(context)) {
        if (typeof value !== "undefined") scope.setTag(key, String(value));
      }
      scope.setExtra("context", context);
    }
    Sentry.captureException(error);
  });
};

// User feedback collection
export const captureUserFeedback = (feedback: {
  name?: string;
  email?: string;
  message: string;
  level?: "info" | "warning" | "error";
}) => {
  Sentry.captureMessage(feedback.message, feedback.level || "info");
};

// Measure Core Web Vitals and send to Sentry
export const measureWebVitals = () => {
  // Dynamically import web-vitals so it can be code-split and doesn't bloat the main bundle.
  void import("web-vitals")
    .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const sendToSentry = (metric: Metric) => {
        // Use captureMessage for web vitals since metrics API may not be available
        Sentry.captureMessage(`Web Vital: ${metric.name}`, {
          level: "info",
          tags: {
            metric_name: metric.name,
            metric_id: metric.id,
            metric_rating: metric.rating,
          },
          extra: {
            value: metric.value,
            unit: metric.name === "CLS" ? undefined : "millisecond",
          },
        });
      };

      onCLS(sendToSentry);
      onINP(sendToSentry); // INP replaced FID in web-vitals v4
      onFCP(sendToSentry);
      onLCP(sendToSentry);
      onTTFB(sendToSentry);
    })
    .catch(() => {
      // Web vitals are optional; do not crash the app if the package cannot be loaded.
    });
};
