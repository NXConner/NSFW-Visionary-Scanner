/**
 * Wellness Analytics Charts
 * Refactored from NSFWSexualWellnessAnalytics.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LazyLineChart,
  LazyBarChart,
  LazyRadarChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "@/components/lazyLoaders/LazyCharts";
import type { NSFWSexualFunctionTracking, NSFWWellnessScore } from "./types";

interface WellnessChartsProps {
  functionData: NSFWSexualFunctionTracking[];
  wellnessScores: NSFWWellnessScore[];
}

function compactDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export const WellnessCharts: React.FC<WellnessChartsProps> = React.memo(
  ({ functionData, wellnessScores }) => {
    const sortedFunction = [...functionData].sort((a, b) =>
      String(a.entry_date).localeCompare(String(b.entry_date)),
    );

    const trendData = sortedFunction.map(entry => ({
      date: compactDate(entry.entry_date),
      score: entry.erectile_function_score ?? null,
      stamina: entry.stamina_minutes ?? null,
      stability: entry.erection_stability ?? null,
      control: entry.control_level ?? null,
    }));

    const radarData = wellnessScores.length
      ? [
          {
            metric: "Function",
            value: Number(wellnessScores[wellnessScores.length - 1].function_score ?? 0),
          },
          {
            metric: "Libido",
            value: Number(wellnessScores[wellnessScores.length - 1].libido_score ?? 0),
          },
          {
            metric: "Satisfaction",
            value: Number(wellnessScores[wellnessScores.length - 1].satisfaction_score ?? 0),
          },
          {
            metric: "Frequency",
            value: Number(wellnessScores[wellnessScores.length - 1].frequency_score ?? 0),
          },
        ]
      : [];

    return (
      <div className="space-y-4">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Function Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LazyLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="stability" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="control" stroke="#f59e0b" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LazyBarChart data={trendData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" />
                <Bar dataKey="stamina" fill="#10b981" />
              </LazyBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Wellness Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LazyRadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Wellness"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                </LazyRadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
);

WellnessCharts.displayName = "WellnessCharts";
