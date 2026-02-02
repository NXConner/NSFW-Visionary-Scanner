import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScanEntry } from "../types";
import { CustomTooltip } from "../components/CustomTooltip";

export function TrendsChart({
  data,
  showLength,
  showCircumference,
  showCurvature,
}: {
  data: ScanEntry[];
  showLength: boolean;
  showCircumference: boolean;
  showCurvature: boolean;
}): JSX.Element {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Measurement Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="lengthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="circumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={v => `${v}cm`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={v => `${v}°`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {showLength && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="length"
                  name="Length"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#lengthGradient)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              )}
              {showCircumference && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="circumference"
                  name="Circumference"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill="url(#circumGradient)"
                  dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--accent))", strokeWidth: 2 }}
                />
              )}
              {showCurvature && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="curvatureAngle"
                  name="Curvature"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 3 }}
                />
              )}

              <ReferenceLine
                yAxisId="right"
                y={0}
                stroke="hsl(var(--success))"
                strokeDasharray="3 3"
                opacity={0.5}
                label={{ value: "Target", fill: "hsl(var(--success))", fontSize: 10 }}
              />

              <Brush
                dataKey="dateLabel"
                height={30}
                stroke="hsl(var(--primary))"
                fill="hsl(var(--secondary))"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
