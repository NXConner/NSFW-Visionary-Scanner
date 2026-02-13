/**
 * Loading Fallback Component
 * Provides a consistent loading UI for lazy-loaded components
 */

import { memo } from "react";
import { AppLoadingScreen } from "./AppLoadingScreen";

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingFallback = memo(
  ({ message = "Loading...", fullScreen = false }: LoadingFallbackProps) => {
    if (fullScreen) {
      return <AppLoadingScreen message={message} />;
    }

    return (
      <main id="main-content" className="flex min-h-[60vh] items-center justify-center p-6">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </main>
    );
  },
);

LoadingFallback.displayName = "LoadingFallback";

// Specific loading components for different sections
export const PageLoadingFallback = memo(() => <AppLoadingScreen message="Loading page..." />);

PageLoadingFallback.displayName = "PageLoadingFallback";

export const RouteLoadingFallback = memo(() => <AppLoadingScreen message="Loading..." />);

RouteLoadingFallback.displayName = "RouteLoadingFallback";
