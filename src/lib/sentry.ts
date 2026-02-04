import * as Sentry from "@sentry/react";
import type { Metric } from "web-vitals";
import { APP_NAME } from "@/config/brand";

// Initialize Sentry for error tracking and performance monitoring
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_APP_ENV || "development";

  if (!dsn || environment === "development") {
    return;
  }

  Sentry.init({
    dsn,
    environment,
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
  Sentry.setTag("app_name", APP_NAME);
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
