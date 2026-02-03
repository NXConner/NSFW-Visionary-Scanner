/**
 * Admin Analytics Panel
 * Analytics dashboard for admins
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, ArrowDown, ArrowUp, BarChart3, Calendar, Download, Package, Users } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useAdminAnalytics, type AnalyticsPeriod } from "@/hooks/useAdminAnalytics";

const AdminAnalyticsCharts = lazy(() =>
  import("./AdminAnalyticsCharts").then(m => ({ default: m.AdminAnalyticsCharts })),
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = typeof change === "number" && change >= 0;
  return (
    <Card className="glass-card">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {typeof change === "number" && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminAnalyticsPanel() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const analytics = useAdminAnalytics(period);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Analytics Overview</h3>
          <p className="text-sm text-muted-foreground">Track key metrics and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={value => setPeriod(value as AnalyticsPeriod)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events"
          value={analytics.totalEvents.toLocaleString()}
          icon={<BarChart3 className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Users"
          value={analytics.activeUsers.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Sessions"
          value={analytics.activeSessions.toLocaleString()}
          icon={<Activity className="w-6 h-6" />}
        />
        <MetricCard
          title="DLC Revenue"
          value={formatCurrency(analytics.dlcRevenue)}
          icon={<Package className="w-6 h-6" />}
        />
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading charts...</div>}>
        <AdminAnalyticsCharts
          loading={analytics.loading}
          series={analytics.series}
          topEvents={analytics.topEvents}
        />
      </Suspense>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
            <CardDescription>Most common analytics events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground">No events recorded yet.</div>
              ) : (
                analytics.topEvents.map((evt, i) => (
                  <div key={evt.name} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{evt.name}</p>
                      <p className="text-sm text-muted-foreground">{evt.count} events</p>
                    </div>
                    <Badge variant="secondary">{evt.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>DLC Performance</CardTitle>
            <CardDescription>Revenue and sales for this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">DLC Sales</p>
                  <p className="text-sm text-muted-foreground">{analytics.dlcSales} purchases</p>
                </div>
                <Badge className="bg-success">{formatCurrency(analytics.dlcRevenue)}</Badge>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New Users</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.newUsers.toLocaleString()} this period
                  </p>
                </div>
                <Badge variant="secondary">{analytics.newUsers}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
