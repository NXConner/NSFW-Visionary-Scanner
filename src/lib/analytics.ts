// Privacy-compliant analytics and user tracking
import { logger } from "./logger";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  subscriptionTier?: "free" | "pro" | "premium";
  userType?: "patient" | "clinician" | "admin";
  deviceType?: "mobile" | "tablet" | "desktop";
  language?: string;
  timezone?: string;
}

type InternalAnalyticsRow = {
  user_id: string;
  session_id: string;
  event_name: string;
  event_category?: string | null;
  event_action?: string | null;
  event_label?: string | null;
  event_value?: number | null;
  properties?: Record<string, any>;
  page_path?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  device_platform?: string | null;
  app_version?: string | null;
  app_build?: string | null;
  distribution_channel?: string | null;
};

// Privacy and consent management
export class PrivacyManager {
  private consentGiven = false;
  private readonly CONSENT_KEY = "morphoscan_analytics_consent";

  constructor() {
    this.loadConsentStatus();
  }

  private loadConsentStatus() {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY);
      this.consentGiven = consent === "true";
    } catch (error) {
      // localStorage not available
      this.consentGiven = false;
    }
  }

  public hasConsent(): boolean {
    return this.consentGiven;
  }

  public grantConsent(): void {
    this.consentGiven = true;
    try {
      localStorage.setItem(this.CONSENT_KEY, "true");
    } catch (error) {
      // localStorage not available
    }
    logger.info("Analytics consent granted", { component: "privacy" });
  }

  public revokeConsent(): void {
    this.consentGiven = false;
    try {
      localStorage.removeItem(this.CONSENT_KEY);
      // Clear any stored analytics data
      this.clearAnalyticsData();
    } catch (error) {
      // localStorage not available
    }
    logger.info("Analytics consent revoked", { component: "privacy" });
  }

  private clearAnalyticsData(): void {
    // Clear any analytics-related data from localStorage
    const keysToRemove = Object.keys(localStorage).filter(
      key =>
        key.startsWith("morphoscan_analytics_") || key.startsWith("_ga") || key.startsWith("_gid"),
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  public showConsentDialog(): Promise<boolean> {
    return new Promise(resolve => {
      // This would typically show a modal dialog
      // For now, we'll just return the current consent status
      resolve(this.consentGiven);
    });
  }
}

// Analytics tracking class
export class Analytics {
  private privacyManager: PrivacyManager;
  private userProperties: UserProperties = {};
  private initialized = false;
  private readonly SESSION_KEY = "morphoscan_analytics_session_id";

  constructor() {
    this.privacyManager = new PrivacyManager();
  }

  private getOrCreateSessionId(): string {
    try {
      const existing = localStorage.getItem(this.SESSION_KEY);
      if (existing) return existing;
      const next =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
      localStorage.setItem(this.SESSION_KEY, next);
      return next;
    } catch {
      return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    }
  }

  private getClientContext(): Pick<
    InternalAnalyticsRow,
    | "page_path"
    | "referrer"
    | "user_agent"
    | "device_platform"
    | "app_version"
    | "app_build"
    | "distribution_channel"
  > {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    const platform = typeof navigator !== "undefined" ? navigator.platform || null : null;
    const pagePath =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : null;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    return {
      page_path: pagePath,
      referrer,
      user_agent: ua,
      device_platform: platform,
      app_version: import.meta.env.VITE_APP_VERSION || null,
      app_build: import.meta.env.VITE_APP_VERSION || null,
      distribution_channel: import.meta.env.VITE_DISTRIBUTION_CHANNEL || null,
    };
  }

  /**
   * First-party analytics (Supabase) - privacy-consented product events.
   * - Only inserts when authenticated (RLS) and consent is granted.
   * - Never throws (analytics must not break UX).
   */
  private async writeInternalEvent(event: AnalyticsEvent): Promise<void> {
    try {
      if (!this.privacyManager.hasConsent()) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const payload: InternalAnalyticsRow = {
        user_id: userId,
        session_id: this.getOrCreateSessionId(),
        event_name: event.event,
        event_category: event.category ?? null,
        event_action: event.action ?? null,
        event_label: event.label ?? null,
        event_value: typeof event.value === "number" ? event.value : null,
        properties: {
          ...(event.customParameters || {}),
          user_properties: this.userProperties,
        },
        ...this.getClientContext(),
      };

      const { error } = await supabase.from("app_analytics_events").insert(payload as any);
      if (error) {
        logger.warn("Internal analytics insert failed", {
          component: "analytics",
          error: error.message,
          event: event.event,
        });
      }
    } catch (e) {
      logger.warn("Internal analytics write failed", {
        component: "analytics",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  public init(measurementId?: string): void {
    if (this.initialized || !measurementId) return;

    if (!this.privacyManager.hasConsent()) {
      logger.info("Analytics not initialized - no user consent", { component: "analytics" });
      return;
    }

    try {
      // Initialize Google Analytics (gtag)
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag("js", new Date());
      gtag("config", measurementId, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_features: false,
      });
      (window as any).gtag = gtag;
      this.initialized = true;

      logger.info("Analytics initialized", {
        component: "analytics",
        measurementId: measurementId.substring(0, 8) + "...", // Partial ID for logging
      });
    } catch (error) {
      logger.error("Failed to initialize analytics", {
        component: "analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  public setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };

    if (this.initialized && (window as any).gtag) {
      (window as any).gtag("config", "GA_MEASUREMENT_ID", {
        custom_map: {
          dimension1: "user_type",
          dimension2: "subscription_tier",
          dimension3: "device_type",
        },
        user_type: properties.userType,
        subscription_tier: properties.subscriptionTier,
        device_type: properties.deviceType,
      });
    }

    logger.info("User properties updated", {
      component: "analytics",
      properties: Object.keys(properties),
    });
  }

  public trackEvent(event: AnalyticsEvent): void {
    if (!this.privacyManager.hasConsent() || !this.initialized) {
      // Still write first-party analytics if consent granted but GA not initialized (e.g., no measurement id).
      if (this.privacyManager.hasConsent() && !this.initialized) {
        void this.writeInternalEvent(event);
      }
      return;
    }

    try {
      if ((window as any).gtag) {
        (window as any).gtag("event", event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_parameters: event.customParameters,
          ...this.userProperties,
        });
      }

      // Also log to our internal logger
      logger.info(`Analytics Event: ${event.event}`, {
        component: "analytics",
        event: event.event,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        ...event.customParameters,
      });
      void this.writeInternalEvent(event);
    } catch (error) {
      logger.error("Failed to track analytics event", {
        component: "analytics",
        event: event.event,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  public trackPageView(page: string, title?: string): void {
    this.trackEvent({
      event: "page_view",
      category: "navigation",
      action: "page_view",
      label: page,
      customParameters: { page_title: title },
    });
  }

  /**
   * Product analytics helpers (standardized naming for funnel analysis)
   */
  public trackFunnel(eventName: string, props?: Record<string, any>): void {
    this.trackEvent({
      event: eventName,
      category: "funnel",
      action: eventName,
      customParameters: props,
    });
  }

  public trackUserAction(
    action: string,
    category = "user_interaction",
    metadata?: Record<string, any>,
  ): void {
    this.trackEvent({
      event: "user_action",
      category,
      action,
      customParameters: metadata,
    });
  }

  public trackScanEvent(
    eventType: "start" | "complete" | "error",
    metadata?: Record<string, any>,
  ): void {
    this.trackEvent({
      event: "scan_" + eventType,
      category: "scanner",
      action: "scan_" + eventType,
      customParameters: metadata,
    });
  }

  public trackSubscriptionEvent(
    eventType: "upgrade" | "downgrade" | "cancel",
    tier?: string,
  ): void {
    this.trackEvent({
      event: "subscription_" + eventType,
      category: "subscription",
      action: "subscription_" + eventType,
      label: tier,
      customParameters: { target_tier: tier },
    });
  }

  public getPrivacyManager(): PrivacyManager {
    return this.privacyManager;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Global analytics instance
export const analytics = new Analytics();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent: (event: AnalyticsEvent) => analytics.trackEvent(event),
    trackPageView: (page: string, title?: string) => analytics.trackPageView(page, title),
    trackUserAction: (action: string, category?: string, metadata?: Record<string, any>) =>
      analytics.trackUserAction(action, category, metadata),
    trackScanEvent: (eventType: "start" | "complete" | "error", metadata?: Record<string, any>) =>
      analytics.trackScanEvent(eventType, metadata),
    setUserProperties: (properties: UserProperties) => analytics.setUserProperties(properties),
    hasConsent: () => analytics.getPrivacyManager().hasConsent(),
    grantConsent: () => analytics.getPrivacyManager().grantConsent(),
    revokeConsent: () => analytics.getPrivacyManager().revokeConsent(),
  };
};

// Declare global types
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
