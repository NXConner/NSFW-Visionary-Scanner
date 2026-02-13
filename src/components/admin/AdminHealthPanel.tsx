/**
 * Admin Health Panel
 * System health monitoring and performance metrics (real checks only)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Server,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

type CheckStatus = "healthy" | "degraded" | "down";

type HealthCheck = {
  name: string;
  status: CheckStatus;
  latencyMs: number | null;
  checkedAtIso: string;
  detail?: string | null;
};

type RecentEvent = {
  timeIso: string;
  event: string;
  type: "info" | "warning" | "success" | "error";
};

type HealthPayload = {
  ok: true;
  checkedAtIso: string;
  env: {
    resendConfigured: boolean;
    stripeConfigured: boolean;
    firebaseConfigured: boolean;
    vapidConfigured: boolean;
  };
  checks: HealthCheck[];
  recentEvents: RecentEvent[];
};

interface PerformanceMetric {
  name: string;
  value: number | null;
  max: number | null;
  unit: string;
  status: "good" | "warning" | "critical";
}

export function AdminHealthPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const started = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke("admin-system-health", { body: {} });
      const elapsed = Math.max(0, Math.round(performance.now() - started));
      setRoundTripMs(elapsed);

      if (error) throw error;
      if (!data || data.ok !== true) {
        throw new Error(String((data as any)?.error ?? "Health check failed"));
      }
      setPayload(data as HealthPayload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn("AdminHealthPanel: health check failed", { error: msg });
      setError(msg);
      setPayload(null);
      setRoundTripMs(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const checks = payload?.checks ?? [];
  const recentEvents = payload?.recentEvents ?? [];

  const totals = useMemo(() => {
    const total = checks.length;
    const healthy = checks.filter(c => c.status === "healthy").length;
    const degraded = checks.filter(c => c.status === "degraded").length;
    const down = checks.filter(c => c.status === "down").length;
    return { total, healthy, degraded, down };
  }, [checks]);

  const avgLatencyMs = useMemo(() => {
    const values = checks
      .map(c => c.latencyMs)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [checks]);

  const systemStatus: { label: string; status: CheckStatus } = useMemo(() => {
    if (totals.down > 0) return { label: "Down", status: "down" };
    if (totals.degraded > 0) return { label: "Degraded", status: "degraded" };
    return { label: "Operational", status: "healthy" };
  }, [totals.degraded, totals.down]);

  const byName = useMemo(() => {
    const map = new Map<string, HealthCheck>();
    for (const c of checks) map.set(c.name, c);
    return map;
  }, [checks]);

  const metrics: PerformanceMetric[] = useMemo(() => {
    const score = (ms: number | null): PerformanceMetric["status"] => {
      if (ms == null) return "warning";
      if (ms <= 400) return "good";
      if (ms <= 1500) return "warning";
      return "critical";
    };

    const db = byName.get("database")?.latencyMs ?? null;
    const storage = byName.get("storage")?.latencyMs ?? null;
    const analytics = byName.get("analytics")?.latencyMs ?? null;

    return [
      {
        name: "Edge Round-trip",
        value: roundTripMs,
        max: 4000,
        unit: "ms",
        status: score(roundTripMs),
      },
      { name: "Database", value: db, max: 2000, unit: "ms", status: score(db) },
      { name: "Storage", value: storage, max: 3000, unit: "ms", status: score(storage) },
      { name: "Analytics", value: analytics, max: 2000, unit: "ms", status: score(analytics) },
    ];
  }, [byName, roundTripMs]);

  const formatTimeAgo = useCallback((timeIso: string): string => {
    const t = new Date(timeIso).getTime();
    if (!Number.isFinite(t)) return "";
    const deltaMs = Date.now() - t;
    const mins = Math.floor(deltaMs / 60000);
    if (mins <= 0) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "down":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p
                  className={`text-2xl font-bold ${
                    systemStatus.status === "healthy"
                      ? "text-success"
                      : systemStatus.status === "degraded"
                        ? "text-warning"
                        : "text-destructive"
                  }`}
                >
                  {systemStatus.label}
                </p>
                {error ? (
                  <p className="text-xs text-destructive mt-1 line-clamp-2">{error}</p>
                ) : payload?.checkedAtIso ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Checked {formatTimeAgo(payload.checkedAtIso)}
                  </p>
                ) : null}
              </div>
              <Activity
                className={`h-8 w-8 ${
                  systemStatus.status === "healthy"
                    ? "text-success"
                    : systemStatus.status === "degraded"
                      ? "text-warning"
                      : "text-destructive"
                }`}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services Healthy</p>
                <p className="text-2xl font-bold">
                  {totals.healthy}/{totals.total || 0}
                </p>
              </div>
              <Server className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Check Latency</p>
                <p className="text-2xl font-bold">
                  {avgLatencyMs != null ? `${avgLatencyMs}ms` : "—"}
                </p>
              </div>
              <Zap className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Providers Configured</p>
                <p className="text-2xl font-bold">
                  {payload
                    ? [
                        payload.env.resendConfigured,
                        payload.env.stripeConfigured,
                        payload.env.firebaseConfigured || payload.env.vapidConfigured,
                      ].filter(Boolean).length
                    : 0}
                  /3
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Performance
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void fetchHealth()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {metrics.map(metric => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                    {metric.value == null ? "—" : `${Math.round(metric.value)}${metric.unit}`}
                  </span>
                </div>
                {metric.value != null && metric.max != null ? (
                  <Progress
                    value={Math.max(0, Math.min(100, (metric.value / metric.max) * 100))}
                    className={`h-2 ${
                      metric.status === "critical"
                        ? "[&>div]:bg-destructive"
                        : metric.status === "warning"
                          ? "[&>div]:bg-warning"
                          : ""
                    }`}
                  />
                ) : (
                  <Progress value={0} className="h-2 opacity-30" />
                )}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Checking…
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Services Status
            </CardTitle>
            <CardDescription>
              Live health checks via admin-only Edge Function (no mock/simulated data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {(checks.length ? checks : []).map(service => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.detail
                            ? service.detail
                            : `Checked ${formatTimeAgo(service.checkedAtIso)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">
                          {service.latencyMs != null ? `${service.latencyMs}ms` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">latency</p>
                      </div>
                      <Badge
                        variant={
                          service.status === "healthy"
                            ? "default"
                            : service.status === "degraded"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!loading && !checks.length && (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                    No health checks available.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Events
          </CardTitle>
          <CardDescription>System events and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event, i) => (
              <div
                key={`${event.timeIso}-${i}`}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                {event.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : event.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : event.type === "error" ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Activity className="h-5 w-5 text-primary" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{event.event}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTimeAgo(event.timeIso)}
                </span>
              </div>
            ))}
            {!loading && recentEvents.length === 0 && (
              <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                No recent events available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
