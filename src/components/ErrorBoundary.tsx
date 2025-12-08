import { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RefreshCw, Home, Bug, Send, Copy } from "lucide-react";
import { logger } from "@/lib/logger";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with structured logging
    logger.errorBoundary(error, errorInfo.componentStack, undefined)

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card variant="glass" className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                An unexpected error occurred. This has been logged for investigation.
              </p>

              {this.state.error && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                  <p className="text-sm font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  variant="default"
                  className="flex-1 gap-2"
                  onClick={this.handleGoHome}
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-secondary/50 text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with hooks
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};
