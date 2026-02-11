/**
 * Admin Health Panel
 * System health monitoring and performance metrics
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  uptime: string;
  lastCheck: string;
}

const services: ServiceStatus[] = [
  { name: "API Server", status: "healthy", latency: 45, uptime: "99.99%", lastCheck: "1 min ago" },
  { name: "Database", status: "healthy", latency: 12, uptime: "99.98%", lastCheck: "1 min ago" },
  {
    name: "Auth Service",
    status: "healthy",
    latency: 23,
    uptime: "99.97%",
    lastCheck: "1 min ago",
  },
  {
    name: "File Storage",
    status: "healthy",
    latency: 156,
    uptime: "99.95%",
    lastCheck: "2 min ago",
  },
  { name: "Cache Server", status: "healthy", latency: 3, uptime: "99.99%", lastCheck: "1 min ago" },
  {
    name: "Email Service",
    status: "degraded",
    latency: 450,
    uptime: "98.5%",
    lastCheck: "3 min ago",
  },
  {
    name: "Push Notifications",
    status: "healthy",
    latency: 89,
    uptime: "99.9%",
    lastCheck: "1 min ago",
  },
  { name: "Analytics", status: "healthy", latency: 34, uptime: "99.8%", lastCheck: "2 min ago" },
];

interface PerformanceMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: "good" | "warning" | "critical";
}

export function AdminHealthPanel() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    { name: "CPU Usage", value: 42, max: 100, unit: "%", status: "good" },
    { name: "Memory Usage", value: 68, max: 100, unit: "%", status: "good" },
    { name: "Disk Usage", value: 54, max: 100, unit: "%", status: "good" },
    { name: "Network I/O", value: 234, max: 1000, unit: "MB/s", status: "good" },
  ]);

  const [recentEvents, setRecentEvents] = useState([
    { time: "2 min ago", event: "Cache server restarted", type: "info" },
    { time: "15 min ago", event: "Email service degraded - investigating", type: "warning" },
    { time: "1 hour ago", event: "Scheduled backup completed", type: "success" },
    { time: "2 hours ago", event: "API rate limit triggered for user", type: "info" },
    { time: "5 hours ago", event: "Database failover successful", type: "success" },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev =>
        prev.map(m => ({
          ...m,
          value: Math.min(m.max, Math.max(0, m.value + (Math.random() - 0.5) * 10)),
          status: m.value > 80 ? "critical" : m.value > 60 ? "warning" : "good",
        })),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const healthyServices = services.filter(s => s.status === "healthy").length;
  const degradedServices = services.filter(s => s.status === "degraded").length;

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
                <p className="text-2xl font-bold text-success">Operational</p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services Healthy</p>
                <p className="text-2xl font-bold">
                  {healthyServices}/{services.length}
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
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(services.reduce((sum, s) => sum + s.latency, 0) / services.length)}ms
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
                <p className="text-sm text-muted-foreground">Uptime (30d)</p>
                <p className="text-2xl font-bold text-success">99.95%</p>
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
              <Button variant="ghost" size="icon">
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
                    {Math.round(metric.value)}
                    {metric.unit}
                  </span>
                </div>
                <Progress
                  value={(metric.value / metric.max) * 100}
                  className={`h-2 ${
                    metric.status === "critical"
                      ? "[&>div]:bg-destructive"
                      : metric.status === "warning"
                        ? "[&>div]:bg-warning"
                        : ""
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Services Status
            </CardTitle>
            <CardDescription>Real-time health monitoring of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {services.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last check: {service.lastCheck}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{service.latency}ms</p>
                        <p className="text-xs text-muted-foreground">latency</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{service.uptime}</p>
                        <p className="text-xs text-muted-foreground">uptime</p>
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
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                {event.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : event.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : (
                  <Activity className="h-5 w-5 text-primary" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{event.event}</p>
                </div>
                <span className="text-sm text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
