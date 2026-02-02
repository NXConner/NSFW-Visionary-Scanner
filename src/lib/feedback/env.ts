import type { FeedbackEnvironment } from "./types";

export function collectFeedbackEnvironment(): FeedbackEnvironment {
  if (typeof window === "undefined") return {};

  const n = window.navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  };

  const screen = window.screen;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    userAgent: n.userAgent,
    platform: n.platform,
    language: n.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    url: window.location.href,
    referrer: document.referrer || undefined,
    screen: screen
      ? { width: screen.width, height: screen.height, dpr: window.devicePixelRatio || 1 }
      : undefined,
    viewport: { width: vw, height: vh },
    connection: n.connection
      ? {
          effectiveType: n.connection.effectiveType,
          downlink: n.connection.downlink,
          rtt: n.connection.rtt,
          saveData: n.connection.saveData,
        }
      : undefined,
    app: {
      version: import.meta.env.VITE_APP_VERSION,
      build: import.meta.env.MODEL_VERSION,
      env: import.meta.env.MODE,
    },
  };
}
