import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import {
  markAppInteractiveAndHideStaticLoader,
  showBootDiagnosticsPanel,
} from "@/lib/boot/staticLoader";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Ensure the static HTML loader can't obscure the error UI.
    try {
      markAppInteractiveAndHideStaticLoader();
      showBootDiagnosticsPanel();
    } catch {
      // ignore
    }
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // IMPORTANT:
      // This ErrorBoundary is used both in the normal React DOM tree AND inside @react-three/fiber <Canvas>.
      // Inside <Canvas>, returning DOM elements (div/button/etc) will crash with:
      // "R3F: <X> is not part of the THREE namespace!"
      //
      // So if a caller *explicitly* provides `fallback` (even `null`), we always respect it.
      // That enables safe usage like: <ErrorBoundary fallback={null}>…</ErrorBoundary>
      const hasFallbackProp = Object.prototype.hasOwnProperty.call(this.props, "fallback");
      if (hasFallbackProp) {
        return this.props.fallback ?? null;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {this.props.section ? `Error in ${this.props.section}` : "Something went wrong"}
                </h1>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded border border-border">
                <p className="text-sm font-mono text-foreground break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>

            {this.state.errorInfo && import.meta.env.DEV && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded border border-border text-xs overflow-auto max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  section?: string,
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary section={section}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
