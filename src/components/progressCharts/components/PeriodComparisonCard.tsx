import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ComparisonBarRow, PeriodData, TimeRange } from "@/components/progressCharts/types";
import { ComparisonTooltip } from "@/components/progressCharts/components/Tooltips";

export function PeriodComparisonCard({
  comparisonBarData,
  previousPeriod,
  timeRange,
}: {
  comparisonBarData: ComparisonBarRow[];
  previousPeriod: PeriodData;
  timeRange: TimeRange;
}) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          Period Comparison
        </CardTitle>
        <CardDescription>
          Current {timeRange} vs Previous {timeRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {previousPeriod.stats.count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data available for the previous period</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                  horizontal={false}
                />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="metric"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={70}
                />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={value => <span className="text-xs">{value as string}</span>}
                />
                <Bar
                  dataKey="previous"
                  name="Previous"
                  fill="hsl(var(--muted-foreground))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="current"
                  name="Current"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
