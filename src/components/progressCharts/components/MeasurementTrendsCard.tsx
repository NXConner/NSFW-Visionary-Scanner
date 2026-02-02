import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartType, ProcessedEntry } from "@/components/progressCharts/types";
import { CustomTooltip } from "@/components/progressCharts/components/Tooltips";

export function MeasurementTrendsCard({
  filteredData,
  chartType,
  onChartTypeChange,
}: {
  filteredData: ProcessedEntry[];
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
}) {
  const ChartComponent = chartType === "area" ? AreaChart : LineChart;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Measurement Trends</CardTitle>
            <CardDescription>Track your progress over time</CardDescription>
          </div>
          <Tabs value={chartType} onValueChange={v => onChartTypeChange(v as ChartType)}>
            <TabsList className="h-8">
              <TabsTrigger value="area" className="text-xs px-2">
                Area
              </TabsTrigger>
              <TabsTrigger value="line" className="text-xs px-2">
                Line
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={value => <span className="text-xs">{value as string}</span>}
              />
              {chartType === "area" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="length"
                    name="Length"
                    stroke="hsl(var(--primary))"
                    fill="url(#lengthGradient)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="circumference"
                    name="Circumference"
                    stroke="hsl(var(--accent))"
                    fill="url(#circumGradient)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--accent))", strokeWidth: 2 }}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="length"
                    name="Length"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="circumference"
                    name="Circumference"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--accent))", strokeWidth: 2 }}
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
