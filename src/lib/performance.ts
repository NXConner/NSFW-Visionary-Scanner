// Core Web Vitals and Performance Monitoring
import { logger } from "./logger";

type GoogleAnalyticsGtag = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

type WindowWithGtag = Window & { gtag?: GoogleAnalyticsGtag };

type FirstInputPerformanceEntry = PerformanceEntry & {
  processingStart: number;
};

type LayoutShiftEntry = PerformanceEntry & {
  hadRecentInput: boolean;
  value: number;
};

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
}

// Performance observer for Core Web Vitals
export class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];
  private metrics: PerformanceMetrics = {};

  constructor() {
    this.initObservers();
    this.trackNavigationTiming();
  }

  private initObservers() {
    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (!lastEntry) return;
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric("LCP", lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const e = entry as FirstInputPerformanceEntry;
            if (typeof e.processingStart !== "number") return;
            this.metrics.fid = e.processingStart - e.startTime;
            this.reportMetric("FID", e.processingStart - e.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach(entry => {
            const e = entry as LayoutShiftEntry;
            if (typeof e.hadRecentInput !== "boolean" || typeof e.value !== "number") return;
            if (!e.hadRecentInput) {
              clsValue += e.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric("CLS", clsValue);
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(clsObserver);
      } catch (error) {
        logger.error("Failed to initialize performance observers", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  private trackNavigationTiming() {
    if ("performance" in window && "getEntriesByType" in performance) {
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
          this.metrics.domContentLoaded =
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          this.metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

          this.reportMetric("TTFB", this.metrics.ttfb!);
          this.reportMetric("DOM Content Loaded", this.metrics.domContentLoaded!);
          this.reportMetric("Load Complete", this.metrics.loadComplete!);
        }
      });
    }
  }

  private reportMetric(name: string, value: number) {
    logger.info(`Performance Metric: ${name}`, {
      component: "performance_monitor",
      metric: name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Send to analytics if available
    const w = window as WindowWithGtag;
    if (typeof w.gtag === "function") {
      w.gtag("event", "web_vitals", {
        name,
        value: Math.round(value * 100) / 100,
        event_category: "Web Vitals",
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public measureInteraction(name: string, element?: Element) {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        logger.info(`User Interaction: ${name}`, {
          component: "performance_monitor",
          action: "user_interaction",
          interaction: name,
          duration: Math.round(duration * 100) / 100,
          element: element?.tagName || "unknown",
        });
      },
    };
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;

      logger.info(`Function Performance: ${name}`, {
        component: "performance_monitor",
        function: name,
        duration: Math.round(duration * 100) / 100,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Function Error: ${name}`, {
        component: "performance_monitor",
        function: name,
        duration: Math.round(duration * 100) / 100,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const initPerformanceMonitoring = () => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

export const getPerformanceMetrics = () => {
  return performanceMonitor?.getMetrics() || {};
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    measureInteraction: (name: string, element?: Element) =>
      performanceMonitor?.measureInteraction(name, element),
    measureFunction: <T>(name: string, fn: () => T) =>
      performanceMonitor?.measureFunction(name, fn),
    getMetrics: () => performanceMonitor?.getMetrics() || {},
  };
};
