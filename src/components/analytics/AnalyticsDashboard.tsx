import { lazy, Suspense, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, RefreshCw, Shield, Target, Users } from "lucide-react";
import { TIME_RANGES } from "./constants";
import { useAnalyticsDashboardData } from "./useAnalyticsDashboard";
import type { AnalyticsDashboardProps, AnalyticsTimeRange } from "./types";
import { cn } from "@/lib/utils";

const LazyAnalyticsCharts = lazy(() => import("./AnalyticsCharts"));

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
};

function MetricCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  helper?: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AnalyticsDashboard = ({ className, isAdmin = false }: AnalyticsDashboardProps) => {
  const { user } = useAuth();
  const analytics = useAnalytics();
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useAnalyticsDashboardData({
    userId: user?.id ?? null,
    isAdmin,
    timeRange,
    refreshKey,
  });

  const isConsentGranted = useMemo(() => analytics.hasConsent(), [analytics]);

  const handleConsentToggle = () => {
    if (isConsentGranted) {
      analytics.revokeConsent();
    } else {
      analytics.grantConsent();
    }
  };

  const overview = data?.overview;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Privacy-first insights from first-party analytics events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timeRange}
            onChange={event => setTimeRange(event.target.value as AnalyticsTimeRange)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            {TIME_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleConsentToggle}>
            <Shield className="h-4 w-4" />
            {isConsentGranted ? "Disable Analytics" : "Enable Analytics"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading analytics...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No analytics data available.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Events"
              value={overview ? overview.totalEvents.toLocaleString() : "0"}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <MetricCard
              title="Active Users"
              value={overview ? overview.activeUsers.toLocaleString() : "0"}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Avg Session"
              value={overview ? formatDuration(overview.averageSessionDuration) : "0s"}
              icon={<Clock className="h-5 w-5" />}
              helper={`Bounce rate ${overview?.bounceRate ?? 0}%`}
            />
            <MetricCard
              title="Total Scans"
              value={overview ? overview.totalScans.toLocaleString() : "0"}
              icon={<Target className="h-5 w-5" />}
            />
          </div>

          <Suspense
            fallback={
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Loading analytics charts...
                </CardContent>
              </Card>
            }
          >
            <LazyAnalyticsCharts data={data} />
          </Suspense>
        </>
      )}
    </div>
  );
};
