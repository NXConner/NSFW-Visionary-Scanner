import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Clock,
  RefreshCw,
  Shield,
  Target,
  Users,
  Zap,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { CHART_COLORS, TIME_RANGES } from "./constants";
import { useAnalyticsDashboardData } from "./useAnalyticsDashboard";
import type { AnalyticsDashboardProps, AnalyticsTimeRange } from "./types";
import { cn } from "@/lib/utils";

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
          <CardContent className="py-10 text-center text-sm text-destructive">
            {error}
          </CardContent>
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

          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="usage">Feature Usage</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
            </TabsList>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Trends</CardTitle>
                  <CardDescription>Daily events, users, sessions, and scans.</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="events" stroke={CHART_COLORS[0]} />
                      <Line type="monotone" dataKey="users" stroke={CHART_COLORS[1]} />
                      <Line type="monotone" dataKey="sessions" stroke={CHART_COLORS[2]} />
                      <Line type="monotone" dataKey="scans" stroke={CHART_COLORS[3]} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>Top Feature Usage</CardTitle>
                  <CardDescription>Most frequent events in this period.</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.featureUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS[0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid gap-2">
                    {data.featureUsage.map(feature => (
                      <div key={feature.name} className="flex items-center justify-between text-sm">
                        <span className="truncate">{feature.name}</span>
                        <span className="text-muted-foreground">
                          {feature.count} ({feature.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devices">
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Platform distribution of analytics events.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-[260px_1fr]">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.deviceBreakdown}
                          dataKey="count"
                          nameKey="device"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {data.deviceBreakdown.map((entry, index) => (
                            <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {data.deviceBreakdown.map(device => (
                      <div key={device.device} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          {device.device}
                        </span>
                        <Badge variant="secondary">
                          {device.count} ({device.percentage}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle>Error Metrics</CardTitle>
                  <CardDescription>Most common error events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.errorMetrics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No error events recorded.</p>
                  ) : (
                    data.errorMetrics.map(metric => (
                      <div key={metric.type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          {metric.type}
                        </span>
                        <span className="text-muted-foreground">
                          {metric.count} · {new Date(metric.lastOccurred).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retention">
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>Active user retention by time window.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.retention.map(point => (
                    <div key={point.period} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {point.period}
                      </span>
                      <Badge variant="secondary">{point.rate}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
