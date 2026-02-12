import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, measureWebVitals } from "./lib/sentry";
import { initializeSecurity, generateCSPHeader } from "./lib/security";
import { initStorageMonitoring } from "./lib/storageErrorHandler";
import { installConsoleInterceptor } from "./lib/logger";
import { registerPwaIfAllowed } from "./pwa/register";
import {
  initializeCapacitor,
  hideSplashScreen,
  isNative,
  installMobileErrorHandler,
} from "./lib/capacitor";

type BootApi = {
  markStage?: (msg: string) => void;
  hideLoader?: () => void;
  fail?: (reason: string, details?: unknown) => void;
};

function getBootApi(): BootApi | null {
  try {
    return ((window as unknown as { __MORPHOSCAN_BOOT__?: BootApi }).__MORPHOSCAN_BOOT__ ??
      null) as BootApi | null;
  } catch {
    return null;
  }
}

function bootStage(msg: string): void {
  try {
    getBootApi()?.markStage?.(msg);
  } catch {
    // ignore
  }
}

function bootFail(reason: string, details?: unknown): void {
  try {
    getBootApi()?.fail?.(reason, details);
  } catch {
    // ignore
  }
}

// === AGGRESSIVE STARTUP OPTIMIZATION ===
// Prevent infinite loading in pop-out preview / iframe scenarios

// Tab navigation hardening (E2E + slow devices):
// Some callers dispatch "navigate-tab" very early (before the Index tab listener is mounted).
// Capture the latest requested tab so Index can apply it once ready.
const PENDING_TAB_KEY = "__MORPHOSCAN_PENDING_TAB__";
try {
  (window as any).__MORPHOSCAN_BOOTSTRAP__ = true;
  bootStage("Booting…");
  window.addEventListener("navigate-tab", (e: Event) => {
    try {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.length > 0) {
        (window as any)[PENDING_TAB_KEY] = detail;
      }
    } catch {
      // ignore
    }
  });
} catch {
  // ignore
}

// 1. SYNCHRONOUS service worker + cache cleanup FIRST (blocks for max 50ms)
const cleanupSync = () => {
  try {
    // Force unregister any service workers immediately
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
    // Clear caches
    if ("caches" in window) {
      caches.keys().then(keys => {
        keys.forEach(k => caches.delete(k));
      });
    }
  } catch {
    // Ignore errors - this is best-effort cleanup
  }
};

// Run cleanup immediately on any Lovable/preview host
const hostname = window.location.hostname.toLowerCase();
const protocol = window.location.protocol.toLowerCase();
const isPreviewHost =
  hostname.includes("lovable") ||
  hostname.includes("cursor") ||
  hostname.endsWith(".lovableproject.com") ||
  hostname.endsWith(".lovable.dev") ||
  hostname.endsWith(".lovable.app") ||
  hostname.endsWith(".cursor.sh") ||
  hostname.endsWith(".cursor.so");
const isLikelyNativeHost =
  protocol === "capacitor:" ||
  protocol === "file:" ||
  (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1")) ||
  (protocol === "https:" && hostname === "localhost");
const isLikelyNativeBoot = isNative() || isLikelyNativeHost;

// Allow forcing cleanup for debugging without slowing down local dev by default.
// Set VITE_FORCE_SW_CLEANUP=1 to enable.
const forceCleanup = import.meta.env.VITE_FORCE_SW_CLEANUP === "1";

if (isPreviewHost || forceCleanup || isLikelyNativeBoot) {
  cleanupSync();
}

// 2. Hide loading spinner - AGGRESSIVE fallback chain
const hideLoader = () => {
  const loader = document.getElementById("app-loader");
  if (!loader) return;
  loader.style.opacity = "0";
  loader.style.pointerEvents = "none";
  setTimeout(() => loader.remove(), 150);
};

// Never remove the loader too early on native devices; it can create a "blank screen"
// period while the JS bundle is still parsing/initializing on first run.
setTimeout(
  () => {
    try {
      // Prefer index.html boot script (keeps diagnostics visible if needed)
      getBootApi()?.hideLoader?.();
    } catch {
      // ignore
    }
    hideLoader();
  },
  isLikelyNativeBoot ? 12000 : 6000,
);

// 3. Safe initialization wrapper (never blocks boot)
const safeInit = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* ignore */
  }
};

const deferInit = (fn: () => void) => {
  try {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };
    const ric = w.requestIdleCallback;
    if (typeof ric === "function") {
      ric(() => safeInit(fn), { timeout: 2000 });
      return;
    }
  } catch {
    // ignore
  }
  setTimeout(() => safeInit(fn), 0);
};

let splashFallbackTimer: ReturnType<typeof setTimeout> | null = null;
const clearSplashFallbackTimer = () => {
  if (!splashFallbackTimer) return;
  clearTimeout(splashFallbackTimer);
  splashFallbackTimer = null;
};
const hideNativeSplashSafely = async () => {
  if (!isLikelyNativeBoot) return;
  try {
    await hideSplashScreen();
  } finally {
    clearSplashFallbackTimer();
  }
};

if (isLikelyNativeBoot) {
  // Absolute fail-safe: never leave users pinned behind native splash forever.
  splashFallbackTimer = setTimeout(() => {
    void hideNativeSplashSafely();
  }, 7000);
}

// 4. Initialize Capacitor for mobile (non-blocking)
if (isLikelyNativeBoot) {
  // Install mobile error handlers immediately
  safeInit(installMobileErrorHandler);
  // Initialize Capacitor (async, non-blocking)
  initializeCapacitor().catch(err => {
    console.warn("[Main] Capacitor init error (non-fatal):", err);
  });
}

// 5. Initialize React app IMMEDIATELY (do not block on non-critical init)
const rootEl = document.getElementById("root");
if (rootEl) {
  try {
    bootStage("Rendering UI…");
    const root = createRoot(rootEl);
    root.render(<App />);

    // Let BootWatchdog (and native boot) know that React has started.
    try {
      window.__APP_INTERACTIVE__ = true;
    } catch {
      // ignore
    }

    // Prefer the index.html boot layer to remove the loader (it can show diagnostics
    // instead of leaving a blank screen if something is wrong).
    try {
      getBootApi()?.hideLoader?.();
    } catch {
      // ignore
    }
    requestAnimationFrame(hideLoader);

    // Hide splash screen after React renders (for Capacitor)
    if (isLikelyNativeBoot) {
      // Give React a moment to render, then hide splash
      requestAnimationFrame(() => {
        setTimeout(() => {
          hideNativeSplashSafely().catch(err => {
            console.warn("[Main] Failed to hide splash:", err);
          });
        }, 100);
      });
    }
  } catch {
    bootFail("React render failed");
    // Emergency fallback: show error message instead of infinite loader
    // Also hide splash screen on error so user sees the error
    if (isLikelyNativeBoot) {
      void hideNativeSplashSafely();
    }
    rootEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#0a0a0a;">
        <div style="text-align:center;padding:2rem;">
          <p style="color:#f87171;font-weight:600;">Failed to load application</p>
          <p style="color:#666;margin-top:0.5rem;font-size:14px;">Please try again or reinstall the app</p>
          <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;cursor:pointer;background:#8B5CF6;color:white;border:none;border-radius:8px;">
            Reload
          </button>
        </div>
      </div>
    `;
  }
}

// 6. Watchdog: if React doesn't mount, never show a blank screen
setTimeout(() => {
  try {
    hideLoader();
    // Also hide splash screen on mobile if app didn't load
    if (isLikelyNativeBoot) {
      void hideNativeSplashSafely();
    }
    const el = document.getElementById("root");
    if (!el) return;
    if (el.childElementCount > 0) return;
    // Avoid overwriting if something already wrote a fallback.
    if (el.getAttribute("data-boot-fallback") === "1") return;
    el.setAttribute("data-boot-fallback", "1");
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;padding:2rem;background:#0a0a0a;">
        <div style="max-width:520px;text-align:center;">
          <p style="margin:0 0 0.5rem;color:#f5f5f5;font-size:18px;font-weight:600;">App didn't finish loading</p>
          <p style="margin:0 0 1rem;color:#999;line-height:1.4;">
            This is usually caused by a stale cache or a blocked storage state.
          </p>
          <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
            <button onclick="location.reload()" style="padding:0.5rem 1rem;cursor:pointer;background:#8B5CF6;color:white;border:none;border-radius:8px;">Reload</button>
            <button onclick="try{localStorage.clear()}catch(e){}; try{sessionStorage.clear()}catch(e){}; location.reload()" style="padding:0.5rem 1rem;cursor:pointer;background:#374151;color:white;border:none;border-radius:8px;">
              Clear Storage + Reload
            </button>
          </div>
        </div>
      </div>
    `;
  } catch {
    // ignore
  }
}, 4500);

// 6. Non-critical startup - defer so UI shows ASAP
deferInit(initSentry);
// Route console.* in production through redacting logger/Sentry.
deferInit(() => installConsoleInterceptor({ minLevel: "info" }));
deferInit(initializeSecurity);
deferInit(initStorageMonitoring);
deferInit(measureWebVitals);
deferInit(registerPwaIfAllowed);
deferInit(() => {
  const cspMeta = document.createElement("meta");
  cspMeta.setAttribute("http-equiv", "Content-Security-Policy");
  cspMeta.setAttribute("content", generateCSPHeader());
  document.head.appendChild(cspMeta);
});

// Final cleanup: ensure loader is gone
requestAnimationFrame(hideLoader);
