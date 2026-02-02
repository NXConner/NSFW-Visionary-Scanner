/**
 * PWA Service Worker Registration
 *
 * We only register the SW on stable, user-facing origins to prevent
 * remote preview environments from being bricked by a stale SW.
 */

function isPreviewHost(): boolean {
  try {
    const hostname = window.location.hostname.toLowerCase();
    return (
      hostname.includes("lovable") ||
      hostname.includes("cursor") ||
      hostname.endsWith(".lovableproject.com") ||
      hostname.endsWith(".lovable.dev") ||
      hostname.endsWith(".lovable.app") ||
      hostname.endsWith(".cursor.sh") ||
      hostname.endsWith(".cursor.so")
    );
  } catch {
    return false;
  }
}

/**
 * Register the PWA service worker only on stable, user-facing origins.
 * This prevents remote preview environments from being bricked by a stale SW.
 */
export function registerPwaIfAllowed(): void {
  if (import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (isPreviewHost()) return;

  // Delay registration to keep boot fast and avoid timing-related races.
  setTimeout(() => {
    // Use Function constructor to completely hide the import from Rollup's static analysis
    // This prevents "virtual:pwa-register" resolution errors when the module doesn't exist
    const dynamicImport = new Function('modulePath', 'return import(modulePath)');
    
    dynamicImport("virtual:pwa-register")
      .then((module: { registerSW: (options: unknown) => void }) => {
        const { registerSW } = module;
        registerSW({
          immediate: false,
          onRegistered: (_swUrl: string, registration: ServiceWorkerRegistration | undefined) => {
            // Best-effort: nudge update checks.
            try {
              registration?.update();
            } catch {
              // ignore
            }
          },
        });
      })
      .catch(() => {
        // PWA registration not available - this is fine in development/preview
      });
  }, 1000);
}
