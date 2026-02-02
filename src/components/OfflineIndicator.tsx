import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export const OfflineIndicator = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isOnline, isSyncing, pendingCount, syncAll } = useOfflineSync();

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (pendingCount === 0) {
      // Hide after a brief "back online" message
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  // Show banner if offline OR has pending items
  if (!showBanner && isOnline && pendingCount === 0) return null;

  const isClickable = isOnline && pendingCount > 0 && !isSyncing;
  const Wrapper = isClickable ? "button" : "div";

  return (
    <Wrapper
      className={cn(
        "fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-lg transition-all",
        isOnline
          ? pendingCount > 0
            ? "border-primary/30 bg-primary/10 text-primary cursor-pointer"
            : "border-success/30 bg-success/10 text-success"
          : "border-warning/40 bg-warning/15 text-warning-foreground",
      )}
      role="status"
      aria-live="polite"
      type={isClickable ? "button" : undefined}
      onClick={isClickable ? () => syncAll() : undefined}
    >
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isOnline ? (
          pendingCount > 0 ? (
            <CloudOff className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span>
          {isSyncing
            ? "Syncing..."
            : isOnline
              ? pendingCount > 0
                ? `${pendingCount} pending - tap to sync`
                : "Back online"
              : "Offline mode"}
        </span>
      </div>
    </Wrapper>
  );
};
