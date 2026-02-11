import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

interface AnalyticsSeriesPoint {
  date: string;
  count: number;
}

interface TopEvent {
  name: string;
  count: number;
}

interface AdminAnalyticsChartsProps {
  series: AnalyticsSeriesPoint[];
  topEvents: TopEvent[];
  loading: boolean;
}

export function AdminAnalyticsCharts({ series, topEvents, loading }: AdminAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Event Volume
          </CardTitle>
          <CardDescription>Analytics events over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading analytics...
              </div>
            ) : series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No analytics events yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Events
          </CardTitle>
          <CardDescription>Most frequent event types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading analytics...
              </div>
            ) : topEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No events available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
