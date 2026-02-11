/**
 * Enhanced Error Boundary Component
 * Advanced error handling with recovery options, error reporting, and user feedback
 */

import { Component, ReactNode, createContext, useContext, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Send,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  Server,
  Clock,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Error types for better categorization
type ErrorType = "network" | "auth" | "data" | "render" | "async" | "unknown";

interface ErrorInfo {
  type: ErrorType;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  recoverable: boolean;
  retryable: boolean;
}

interface ErrorContextType {
  reportError: (error: Error, info?: any) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useErrorReporting = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorReporting must be used within ErrorBoundaryProvider");
  }
  return context;
};

// Classify error type based on error characteristics
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes("network") || message.includes("fetch") || message.includes("cors")) {
    return "network";
  }
  if (
    message.includes("auth") ||
    message.includes("token") ||
    message.includes("unauthorized") ||
    message.includes("session")
  ) {
    return "auth";
  }
  if (message.includes("database") || message.includes("query") || message.includes("pgrst")) {
    return "data";
  }
  if (name === "chunkloaderror" || message.includes("loading chunk")) {
    return "async";
  }
  if (error.stack?.includes("render") || error.stack?.includes("React")) {
    return "render";
  }
  return "unknown";
}

// Get error icon based on type
function getErrorIcon(type: ErrorType) {
  switch (type) {
    case "network":
      return WifiOff;
    case "auth":
      return AlertCircle;
    case "data":
      return Database;
    case "async":
      return Clock;
    case "render":
      return Server;
    default:
      return AlertTriangle;
  }
}

// Get recovery suggestions based on error type
function getRecoverySuggestions(type: ErrorType): string[] {
  switch (type) {
    case "network":
      return [
        "Check your internet connection",
        "Try refreshing the page",
        "If the problem persists, try again later",
      ];
    case "auth":
      return [
        "Your session may have expired",
        "Try signing out and signing back in",
        "Clear your browser cache and cookies",
      ];
    case "data":
      return [
        "There may be a temporary issue with our servers",
        "Try refreshing the page",
        "If the problem persists, please contact support",
      ];
    case "async":
      return [
        "There was an issue loading some content",
        "Try refreshing the page",
        "Clear your browser cache if the issue continues",
      ];
    default:
      return [
        "Try refreshing the page",
        "If the problem persists, please report this issue",
        "Our team has been notified automatically",
      ];
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showReportForm?: boolean;
  enableAutoRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorDetails: ErrorInfo | null;
  retryCount: number;
  isReporting: boolean;
  reportSubmitted: boolean;
  showDetails: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
      retryCount: 0,
      isReporting: false,
      reportSubmitted: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = classifyError(error);
    const errorDetails: ErrorInfo = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      recoverable: errorType !== "unknown",
      retryable: ["network", "async", "data"].includes(errorType),
    };

    return { hasError: true, error, errorDetails };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails: ErrorInfo = {
      type: classifyError(error),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      recoverable: true,
      retryable: true,
    };

    // Log error with structured logging
    logger.errorBoundary(error, errorInfo.componentStack || "", undefined);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service
    this.reportToService(error, errorDetails);

    this.setState({ errorInfo, errorDetails });

    // Auto-retry for recoverable errors
    if (this.props.enableAutoRetry && errorDetails.retryable) {
      this.scheduleAutoRetry();
    }
  }

  private reportToService = async (error: Error, details: ErrorInfo) => {
    try {
      // Report to backend error tracking.
      // Use the existing privacy-consented first-party analytics table to avoid relying on
      // optional error-log tables that may not exist in every environment.
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      await supabase.from("app_analytics_events").insert({
        user_id: userId,
        session_id: null,
        event_name: "client_error",
        event_category: "error",
        event_action: "error_boundary",
        event_label: details.type,
        event_value: 1,
        properties: {
          message: details.message,
          stack: details.stack ?? null,
          componentStack: details.componentStack ?? null,
          url: details.url,
          userAgent: details.userAgent,
        },
        page_path:
          typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        user_agent: details.userAgent ?? null,
        device_platform: typeof navigator !== "undefined" ? navigator.platform || null : null,
        app_version: import.meta.env.VITE_APP_VERSION ?? null,
        app_build: import.meta.env.VITE_APP_VERSION ?? null,
        distribution_channel: import.meta.env.VITE_DISTRIBUTION_CHANNEL ?? null,
        created_at: details.timestamp.toISOString(),
      });
    } catch (reportError) {
      // Silently fail - don't throw during error handling
      console.error("Failed to report error:", reportError);
    }
  };

  private scheduleAutoRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

      setTimeout(() => {
        this.handleRetry();
      }, delay);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
      retryCount: prevState.retryCount + 1,
      reportSubmitted: false,
      showDetails: false,
    }));
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportSubmit = async (additionalInfo: string, email: string) => {
    const { error, errorDetails } = this.state;

    if (!error || !errorDetails) return;

    this.setState({ isReporting: true });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        toast.error("Please sign in before submitting a report.");
        this.setState({ isReporting: false });
        return;
      }

      await supabase.from("app_analytics_events").insert({
        user_id: userId,
        session_id: null,
        event_name: "user_error_report",
        event_category: "error",
        event_action: "user_report",
        event_label: errorDetails.type,
        event_value: 1,
        properties: {
          message: errorDetails.message,
          stack: errorDetails.stack ?? null,
          additionalInfo: additionalInfo || null,
          contactEmail: email || null,
          url: errorDetails.url,
        },
        page_path:
          typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        user_agent: errorDetails.userAgent ?? null,
        device_platform: typeof navigator !== "undefined" ? navigator.platform || null : null,
        app_version: import.meta.env.VITE_APP_VERSION ?? null,
        app_build: import.meta.env.VITE_APP_VERSION ?? null,
        distribution_channel: import.meta.env.VITE_DISTRIBUTION_CHANNEL ?? null,
        created_at: new Date().toISOString(),
      });

      this.setState({ reportSubmitted: true, isReporting: false });
      toast.success("Error report submitted. Thank you!");
    } catch (submitError) {
      this.setState({ isReporting: false });
      toast.error("Failed to submit report. Please try again.");
    }
  };

  handleCopyError = () => {
    const { error, errorDetails } = this.state;
    if (!error || !errorDetails) return;

    const errorText = `
Error Type: ${errorDetails.type}
Message: ${errorDetails.message}
URL: ${errorDetails.url}
Time: ${errorDetails.timestamp.toISOString()}
Stack: ${errorDetails.stack || "N/A"}
    `.trim();

    navigator.clipboard.writeText(errorText);
    toast.success("Error details copied to clipboard");
  };

  render() {
    const { hasError, error, errorDetails, showDetails, isReporting, reportSubmitted, retryCount } =
      this.state;
    const { children, fallback, showReportForm = true, maxRetries = 3 } = this.props;

    if (hasError && error && errorDetails) {
      if (fallback) {
        return fallback;
      }

      const ErrorIcon = getErrorIcon(errorDetails.type);
      const suggestions = getRecoverySuggestions(errorDetails.type);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
                <ErrorIcon className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                Something went wrong
                <Badge variant="outline" className="text-xs">
                  {errorDetails.type}
                </Badge>
              </CardTitle>
              <CardDescription>
                {errorDetails.type === "network"
                  ? "Connection issue detected"
                  : errorDetails.type === "auth"
                    ? "Authentication issue detected"
                    : "An unexpected error occurred"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-mono text-destructive break-all">{error.message}</p>
              </div>

              {/* Recovery Suggestions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">What you can try:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {errorDetails.retryable && retryCount < maxRetries && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={this.handleRetry}>
                    <RefreshCw className="w-4 h-4" />
                    Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                  </Button>
                )}
                <Button variant="default" className="flex-1 gap-2" onClick={this.handleGoHome}>
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical Details Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => this.setState({ showDetails: !showDetails })}
              >
                <span className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Technical Details
                </span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {showDetails && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <div className="p-3 rounded-lg bg-secondary/50 text-xs overflow-auto max-h-40 font-mono">
                    <pre className="whitespace-pre-wrap">
                      {errorDetails.stack || "No stack trace available"}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.handleCopyError}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Error
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Time: {errorDetails.timestamp.toLocaleString()}</p>
                    <p className="truncate">URL: {errorDetails.url}</p>
                  </div>
                </div>
              )}

              {/* Report Form */}
              {showReportForm && !reportSubmitted && (
                <ErrorReportForm onSubmit={this.handleReportSubmit} isLoading={isReporting} />
              )}

              {reportSubmitted && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <p className="text-sm">Thank you for your report!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Error Report Form Component
interface ErrorReportFormProps {
  onSubmit: (info: string, email: string) => void;
  isLoading: boolean;
}

const ErrorReportForm = ({ onSubmit, isLoading }: ErrorReportFormProps) => {
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(additionalInfo, email);
  };

  if (!expanded) {
    return (
      <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(true)}>
        <Send className="w-4 h-4 mr-2" />
        Report this issue
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border">
      <p className="text-sm font-medium">Help us fix this issue</p>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="info">What were you doing?</Label>
        <Textarea
          id="info"
          placeholder="Describe what happened..."
          value={additionalInfo}
          onChange={e => setAdditionalInfo(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Report
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Higher-order component for wrapping components with error boundary
export const withEnhancedErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Partial<Props>,
) => {
  return function WithEnhancedErrorBoundary(props: P) {
    return (
      <EnhancedErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </EnhancedErrorBoundary>
    );
  };
};

// Async error boundary for Suspense boundaries
export const AsyncErrorBoundary = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  return (
    <EnhancedErrorBoundary fallback={fallback} enableAutoRetry maxRetries={2}>
      {children}
    </EnhancedErrorBoundary>
  );
};
