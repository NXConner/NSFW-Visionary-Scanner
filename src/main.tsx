import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, measureWebVitals } from "./lib/sentry";
import { initializeSecurity, generateCSPHeader } from "./lib/security";
import { initStorageMonitoring } from "./lib/storageErrorHandler";
import { installConsoleInterceptor } from "./lib/logger";
import { registerPwaIfAllowed } from "./pwa/register";

// === AGGRESSIVE STARTUP OPTIMIZATION ===
// Prevent infinite loading in pop-out preview / iframe scenarios

// Tab navigation hardening (E2E + slow devices):
// Some callers dispatch "navigate-tab" very early (before the Index tab listener is mounted).
// Capture the latest requested tab so Index can apply it once ready.
const PENDING_TAB_KEY = "__MORPHOSCAN_PENDING_TAB__";
try {
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
const isPreviewHost =
  hostname.includes("lovable") ||
  hostname.includes("cursor") ||
  hostname.endsWith(".lovableproject.com") ||
  hostname.endsWith(".lovable.dev") ||
  hostname.endsWith(".lovable.app") ||
  hostname.endsWith(".cursor.sh") ||
  hostname.endsWith(".cursor.so");

// Allow forcing cleanup for debugging without slowing down local dev by default.
// Set VITE_FORCE_SW_CLEANUP=1 to enable.
const forceCleanup = import.meta.env.VITE_FORCE_SW_CLEANUP === "1";

if (isPreviewHost || forceCleanup) {
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

// EMERGENCY: Force hide loader after 1.5s no matter what
setTimeout(hideLoader, 1500);

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

// 4. Initialize React app IMMEDIATELY (do not block on non-critical init)
const rootEl = document.getElementById("root");
if (rootEl) {
  try {
    const root = createRoot(rootEl);
    root.render(<App />);
  } catch (err) {
    // Emergency fallback: show error message instead of infinite loader
    rootEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;">
        <div style="text-align:center;padding:2rem;">
          <p style="color:#666;">Failed to load application</p>
          <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;cursor:pointer;">
            Reload
          </button>
        </div>
      </div>
    `;
  }
}

// 5. Watchdog: if React doesn't mount, never show a blank screen
setTimeout(() => {
  try {
    hideLoader();
    const el = document.getElementById("root");
    if (!el) return;
    if (el.childElementCount > 0) return;
    // Avoid overwriting if something already wrote a fallback.
    if (el.getAttribute("data-boot-fallback") === "1") return;
    el.setAttribute("data-boot-fallback", "1");
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;padding:2rem;">
        <div style="max-width:520px;text-align:center;">
          <p style="margin:0 0 0.5rem;color:#111;font-size:18px;font-weight:600;">App didn’t finish loading</p>
          <p style="margin:0 0 1rem;color:#666;line-height:1.4;">
            This is usually caused by a stale preview cache or a blocked storage/service worker state.
          </p>
          <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
            <button onclick="location.reload()" style="padding:0.5rem 1rem;cursor:pointer;">Reload</button>
            <button onclick="try{localStorage.clear()}catch(e){}; try{sessionStorage.clear()}catch(e){}; location.reload()" style="padding:0.5rem 1rem;cursor:pointer;">
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
