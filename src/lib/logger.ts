// Structured logging utility for production monitoring
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext extends Record<string, any> {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
  [key: string]: any // Allow additional properties
}

class Logger {
  private isProduction = import.meta.env.PROD
  private appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      version: this.appVersion,
      environment: this.isProduction ? 'production' : 'development',
      ...context,
    }

    if (this.isProduction) {
      // In production, send to monitoring service
      this.sendToMonitoring(logEntry)
    } else {
      // In development, use console with appropriate level
      const consoleMethod = level === 'debug' ? 'debug' :
                           level === 'warn' ? 'warn' :
                           level === 'error' ? 'error' : 'log'

      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '')
    }
  }

  private sendToMonitoring(logEntry: any) {
    // Send to your monitoring service (e.g., DataDog, LogRocket, Sentry)
    // This is a placeholder - implement based on your monitoring solution
    try {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        // Example: Send to Google Analytics or similar
        ;(window as any).dataLayer.push({
          event: 'log_event',
          log_level: logEntry.level,
          log_message: logEntry.message,
          ...logEntry
        })
      }
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error)
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }

  // Specialized logging methods for common events
  userAction(action: string, userId?: string, metadata?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      component: 'user_interaction',
      metadata
    })
  }

  apiCall(endpoint: string, method: string, status: number, duration: number, userId?: string) {
    this.info(`API call: ${method} ${endpoint}`, {
      userId,
      component: 'api',
      action: 'http_request',
      metadata: { endpoint, method, status, duration }
    })
  }

  scanEvent(eventType: 'start' | 'complete' | 'error', userId?: string, metadata?: Record<string, any>) {
    this.info(`Scan ${eventType}`, {
      userId,
      component: 'scanner',
      action: `scan_${eventType}`,
      metadata
    })
  }

  errorBoundary(error: Error, componentStack?: string, userId?: string) {
    this.error('React Error Boundary caught an error', {
      userId,
      component: 'error_boundary',
      metadata: {
        error: error.message,
        stack: error.stack,
        componentStack
      }
    })
  }
}

export const logger = new Logger()
