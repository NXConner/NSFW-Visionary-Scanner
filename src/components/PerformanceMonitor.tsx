import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

// Performance metrics interface
interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null // Cumulative Layout Shift
  fid: number | null // First Input Delay
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  ttfb: number | null // Time to First Byte

  // Additional metrics
  domContentLoaded: number | null
  loadComplete: number | null
  firstPaint: number | null
  navigationTiming: PerformanceNavigationTiming | null
}

interface WebVitalsMetric {
  name: string
  value: number
  id: string
  delta: number
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    firstPaint: null,
    navigationTiming: null
  })

  useEffect(() => {
    // Store cleanup functions
    const cleanupFunctions: (() => void)[] = []
    let longTaskObserver: PerformanceObserver | null = null
    let isMounted = true

    // Monitor Core Web Vitals
    // Note: web-vitals is an npm module, not a window property, so we import it directly.
    // Dynamic import is performed in a useEffect to avoid SSR issues.
    // If using TypeScript and no "@types/web-vitals" exists, add: declare module 'web-vitals'; in a .d.ts file.
    import('web-vitals' as any)
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        if (!isMounted) return;

        // Store cleanup functions for web vitals
        const clsCleanup = getCLS((metric: WebVitalsMetric) => {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, cls: metric.value }))
          logWebVital('CLS', metric)
        }
      })

      const fidCleanup = getFID((metric: WebVitalsMetric) => {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, fid: metric.value }))
          logWebVital('FID', metric)
        }
      })

      const fcpCleanup = getFCP((metric: WebVitalsMetric) => {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, fcp: metric.value }))
          logWebVital('FCP', metric)
        }
      })

      const lcpCleanup = getLCP((metric: WebVitalsMetric) => {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, lcp: metric.value }))
          logWebVital('LCP', metric)
        }
      })

      const ttfbCleanup = getTTFB((metric: WebVitalsMetric) => {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, ttfb: metric.value }))
          logWebVital('TTFB', metric)
        }
      })

      // Store cleanup functions if they exist
      if (typeof clsCleanup === 'function') cleanupFunctions.push(clsCleanup)
      if (typeof fidCleanup === 'function') cleanupFunctions.push(fidCleanup)
      if (typeof fcpCleanup === 'function') cleanupFunctions.push(fcpCleanup)
      if (typeof lcpCleanup === 'function') cleanupFunctions.push(lcpCleanup)
      if (typeof ttfbCleanup === 'function') cleanupFunctions.push(ttfbCleanup)
    }).catch(error => {
      if (isMounted) {
        logger.error('Failed to load web-vitals', { error })
      }
    })

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0]
        setMetrics(prev => ({ ...prev, navigationTiming: navigation }))

        // Log navigation metrics
        logger.info('Navigation timing collected', {
          component: 'performance',
          action: 'navigation_timing',
          metadata: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart
          }
        })
      }
    }

    // Monitor DOM events
    const handleDOMContentLoaded = () => {
      const domContentLoaded = performance.now()
      setMetrics(prev => ({ ...prev, domContentLoaded }))

      logger.info('DOM Content Loaded', {
        component: 'performance',
        action: 'dom_content_loaded',
        metadata: { time: domContentLoaded }
      })
    }

    const handleLoad = () => {
      const loadComplete = performance.now()
      setMetrics(prev => ({ ...prev, loadComplete }))

      logger.info('Page Load Complete', {
        component: 'performance',
        action: 'page_load_complete',
        metadata: { time: loadComplete }
      })
    }

    const handleFirstPaint = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint')
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')

        if (firstPaint) {
          setMetrics(prev => ({ ...prev, firstPaint: firstPaint.startTime }))
        }

        logger.info('Paint metrics collected', {
          component: 'performance',
          action: 'paint_metrics',
          metadata: {
            firstPaint: firstPaint?.startTime,
            firstContentfulPaint: firstContentfulPaint?.startTime
          }
        })
      }
    }

    // Add event listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded)
      window.addEventListener('load', handleLoad)
      // Store cleanup for these listeners
      cleanupFunctions.push(() => {
        document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded)
        window.removeEventListener('load', handleLoad)
      })
    } else {
      // Page already loaded
      handleDOMContentLoaded()
      handleLoad()
    }

    window.addEventListener('load', handleFirstPaint)
    cleanupFunctions.push(() => {
      window.removeEventListener('load', handleFirstPaint)
    })

    // Monitor long tasks (tasks > 50ms)
    if ('PerformanceObserver' in window) {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              logger.warn('Long task detected', {
                component: 'performance',
                action: 'long_task',
                metadata: {
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              })
            }
          }
        })

        longTaskObserver.observe({ type: 'longtask', buffered: true })
      } catch (error) {
        logger.error('Failed to set up long task monitoring', { error })
      }
    }

    // Monitor memory usage (if available)
    const monitorMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        logger.info('Memory usage', {
          component: 'performance',
          action: 'memory_usage',
          metadata: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        })
      }
    }

    // Monitor memory every 30 seconds
    const memoryInterval = setInterval(monitorMemoryUsage, 30000)

    return () => {
      // Mark component as unmounted
      isMounted = false

      // Clear memory monitoring interval
      clearInterval(memoryInterval)

      // Disconnect PerformanceObserver
      if (longTaskObserver) {
        longTaskObserver.disconnect()
        longTaskObserver = null
      }

      // Execute all cleanup functions (event listeners, web vitals, etc.)
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          logger.error('Error during performance monitor cleanup', { error })
        }
      })
    }
  }, [])

  return metrics
}

// Helper function to log Web Vitals
const logWebVital = (name: string, metric: WebVitalsMetric) => {
  const level = getMetricLevel(name, metric.value)

  const logMethod = level === 'good' ? 'info' : level === 'needs-improvement' ? 'warn' : 'error'

  logger[logMethod](`${name} measured`, {
    component: 'performance',
    action: 'web_vital',
    metadata: {
      name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      level
    }
  })
}

// Determine if metric is good, needs improvement, or poor
const getMetricLevel = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  switch (name) {
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'FCP':
    case 'LCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'good'
  }
}

// Performance monitoring component for development
export const PerformanceMonitor = () => {
  const metrics = usePerformanceMonitor()

  if (import.meta.env.PROD) {
    return null // Don't render in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold mb-2">Performance Monitor</h3>

      <div className="space-y-1">
        {metrics.fcp && (
          <div>FCP: {metrics.fcp.toFixed(0)}ms</div>
        )}
        {metrics.lcp && (
          <div>LCP: {metrics.lcp.toFixed(0)}ms</div>
        )}
        {metrics.cls !== null && (
          <div>CLS: {metrics.cls.toFixed(3)}</div>
        )}
        {metrics.fid && (
          <div>FID: {metrics.fid.toFixed(0)}ms</div>
        )}
        {metrics.ttfb && (
          <div>TTFB: {metrics.ttfb.toFixed(0)}ms</div>
        )}
        {metrics.domContentLoaded && (
          <div>DCL: {metrics.domContentLoaded.toFixed(0)}ms</div>
        )}
        {metrics.loadComplete && (
          <div>Load: {metrics.loadComplete.toFixed(0)}ms</div>
        )}
      </div>
    </div>
  )
}

// Performance measurement utility
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T> | T
): Promise<T> {
  const startTime = performance.now()

  try {
    const result = await operation()
    const duration = performance.now() - startTime

    logger.info(`Performance: ${name}`, {
      component: 'performance',
      action: 'operation_timing',
      metadata: {
        operation: name,
        duration,
        success: true
      }
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    logger.error(`Performance: ${name} failed`, {
      component: 'performance',
      action: 'operation_timing',
      metadata: {
        operation: name,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    throw error
  }
}