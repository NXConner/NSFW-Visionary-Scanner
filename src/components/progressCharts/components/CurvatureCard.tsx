import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Target } from "lucide-react";

import type { ProcessedEntry } from "@/components/progressCharts/types";
import { CustomTooltip } from "@/components/progressCharts/components/Tooltips";

export function CurvatureCard({ filteredData }: { filteredData: ProcessedEntry[] }) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-warning" />
          Curvature Progression
        </CardTitle>
        <CardDescription>Monitor curvature angle changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="curvatureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
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
                domain={[0, 90]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea y1={0} y2={30} fill="hsl(var(--success))" fillOpacity={0.1} />
              <ReferenceArea y1={30} y2={60} fill="hsl(var(--warning))" fillOpacity={0.1} />
              <ReferenceArea y1={60} y2={90} fill="hsl(var(--destructive))" fillOpacity={0.1} />
              <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="5 5" />
              <ReferenceLine y={60} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="curvatureAngle"
                name="Curvature"
                stroke="hsl(var(--warning))"
                fill="url(#curvatureGradient)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--warning))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--warning))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/30" />
            <span>Normal (&lt;30°)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning/30" />
            <span>Moderate (30-60°)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/30" />
            <span>Severe (&gt;60°)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
