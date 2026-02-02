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

export const WellnessCharts: React.FC<WellnessChartsProps> = React.memo(
  ({ functionData, wellnessScores }) => {
    const trendData = functionData.map(entry => ({
      date: entry.entry_date,
      score: entry.erectile_function_score || 0,
      stamina: entry.stamina_minutes || 0,
      satisfaction: entry.satisfaction_score || 0,
    }));

    const radarData = wellnessScores.length
      ? [
          {
            metric: "Function",
            value: wellnessScores[wellnessScores.length - 1].function_score,
          },
          {
            metric: "Libido",
            value: wellnessScores[wellnessScores.length - 1].libido_score,
          },
          {
            metric: "Satisfaction",
            value: wellnessScores[wellnessScores.length - 1].satisfaction_score,
          },
          {
            metric: "Frequency",
            value: wellnessScores[wellnessScores.length - 1].frequency_score,
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
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="stamina" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2} />
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
