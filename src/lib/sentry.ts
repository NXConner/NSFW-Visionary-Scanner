import * as Sentry from '@sentry/react'
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// Initialize Sentry for error tracking and performance monitoring
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_APP_ENV || 'development'

  if (!dsn || environment === 'development') {
    console.log('Sentry not initialized - missing DSN or in development mode')
    return
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [/^https:\/\/.*\.supabase\.co/],
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // Capture 100% of transactions in development, 10% in production
    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  })

  // Set user context if available
  const userId = localStorage.getItem('user_id')
  if (userId) {
    Sentry.setUser({ id: userId })
  }

  // Set tags for better error categorization
  Sentry.setTag('app_version', import.meta.env.VITE_APP_VERSION || 'unknown')
  Sentry.setTag('app_name', 'MorphoScan Pro')
}

// Performance monitoring helper
export const measurePerformance = async (name: string, fn: () => void | Promise<void>) => {
  return Sentry.startSpan(
    {
      name,
      op: 'function'
    },
    async () => {
      try {
        const result = fn()
        if (result instanceof Promise) {
          return await result
        }
        return result
      } catch (error) {
        Sentry.captureException(error)
        throw error
      }
    }
  )
}

// Error boundary wrapper for React components
// Note: For JSX fallback components, create a separate .tsx file
export const withErrorBoundary = (Component: React.ComponentType) => {
  return Sentry.withErrorBoundary(Component)
}

// Custom error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key])
      })
    }
    Sentry.captureException(error)
  })
}

// User feedback collection
export const captureUserFeedback = (feedback: {
  name?: string
  email?: string
  message: string
  level?: 'info' | 'warning' | 'error'
}) => {
  Sentry.captureMessage(feedback.message, feedback.level || 'info')
}

// Measure Core Web Vitals and send to Sentry
export const measureWebVitals = () => {
  const sendToSentry = (metric: Metric) => {
    Sentry.metrics.distribution(metric.name, metric.value, {
      tags: {
        id: metric.id,
        name: metric.name,
        rating: metric.rating,
      },
      unit: metric.name === 'CLS' ? undefined : 'millisecond',
    })
  }

  onCLS(sendToSentry)
  onFID(sendToSentry)
  onFCP(sendToSentry)
  onLCP(sendToSentry)
  onTTFB(sendToSentry)
}