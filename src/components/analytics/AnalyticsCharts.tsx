import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Smartphone, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./constants";
import type { AnalyticsData } from "./types";

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  return (
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
  );
}
