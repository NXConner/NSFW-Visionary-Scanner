import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

type BootWatchdogProps = {
  /**
   * If the app is still not "interactive" after this duration, show recovery UI.
   */
  timeoutMs?: number;
  /**
   * Global window flag that should become true once the app is usable.
   * Set by `AppContent` on mount.
   */
  readyFlagKey?: string;
};

function getWinFlag(key: string): boolean {
  try {
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w?.[key]);
  } catch {
    return false;
  }
}

async function tryDeleteIndexedDb(dbName: string): Promise<void> {
  await new Promise<void>(resolve => {
    try {
      if (typeof indexedDB === "undefined") return resolve();
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function BootWatchdog({
  timeoutMs = 7000,
  readyFlagKey = "__APP_INTERACTIVE__",
}: BootWatchdogProps): React.ReactElement | null {
  const [tripped, setTripped] = useState(false);

  const isPreviewHost = useMemo(() => {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const protocol = window.location.protocol.toLowerCase();
      const isLikelyNative =
        protocol === "capacitor:" ||
        protocol === "file:" ||
        (protocol === "https:" && hostname === "localhost");
      return (
        isLikelyNative ||
        hostname.includes("lovable") ||
        hostname.includes("cursor") ||
        hostname.endsWith(".lovableproject.com") ||
        hostname.endsWith(".lovable.dev") ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".cursor.sh") ||
        hostname.endsWith(".cursor.so") ||
        import.meta.env.DEV
      );
    } catch {
      return Boolean(import.meta.env.DEV);
    }
  }, []);

  useEffect(() => {
    if (!isPreviewHost) return;

    const timer = window.setTimeout(() => {
      if (!getWinFlag(readyFlagKey)) setTripped(true);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [isPreviewHost, readyFlagKey, timeoutMs]);

  if (!tripped) return null;

  const handleReload = () => window.location.reload();

  const handleClearAndReload = async () => {
    try {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }

      // Clear known IndexedDB stores used by this app.
      await Promise.all([
        tryDeleteIndexedDb("morphoscan"), // wallpaper + kv
        tryDeleteIndexedDb("nsfw_media_cache"),
        tryDeleteIndexedDb("dlc_content"),
        tryDeleteIndexedDb("dlc_download_resume"),
      ]);
    } finally {
      window.location.reload();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recovery options"
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card variant="glass" className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-destructive/10 w-fit">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Still loading…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This usually indicates a stale preview cache or a corrupted local storage/IndexedDB
            state.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1 gap-2" onClick={handleReload}>
              <RefreshCw className="w-4 h-4" />
              Reload
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleClearAndReload}>
              <Trash2 className="w-4 h-4" />
              Clear Storage + Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
