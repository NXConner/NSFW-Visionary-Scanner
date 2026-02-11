/**
 * Trend Chart Component
 * Visualization of health trends and predictions
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type DataPoint,
  type TrendResult,
  type AnomalyDetectionResult,
} from "@/lib/healthPrediction";

export interface TrendChartProps {
  dataPoints: DataPoint[];
  trend?: TrendResult;
  anomalies?: AnomalyDetectionResult;
  projectedPoints?: DataPoint[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showProjection?: boolean;
  className?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
  isProjected?: boolean;
  isAnomaly?: boolean;
  anomalySeverity?: "mild" | "moderate" | "severe";
}

export function TrendChart({
  dataPoints,
  trend,
  anomalies,
  projectedPoints = [],
  title = "Trend Analysis",
  height = 200,
  showGrid = true,
  showLabels = true,
  showProjection = true,
  className,
}: TrendChartProps) {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Process data points into chart coordinates
  const chartData = useMemo(() => {
    const allPoints = [...dataPoints, ...(showProjection ? projectedPoints : [])];

    if (allPoints.length === 0) return { points: [], minY: 0, maxY: 100 };

    const values = allPoints.map(d => d.value);
    const minY = Math.min(...values) * 0.9;
    const maxY = Math.max(...values) * 1.1;

    const anomalyIndices = new Set(anomalies?.anomalies.map(a => a.index) || []);
    const anomalyMap = new Map(anomalies?.anomalies.map(a => [a.index, a.severity]) || []);

    const points: ChartPoint[] = allPoints.map((point, index) => {
      const isProjected = index >= dataPoints.length;
      const dataIndex = isProjected ? -1 : index;

      return {
        x: (index / (allPoints.length - 1)) * innerWidth + padding.left,
        y: padding.top + innerHeight - ((point.value - minY) / (maxY - minY)) * innerHeight,
        value: point.value,
        date: point.timestamp,
        isProjected,
        isAnomaly: anomalyIndices.has(dataIndex),
        anomalySeverity: anomalyMap.get(dataIndex),
      };
    });

    return { points, minY, maxY };
  }, [dataPoints, projectedPoints, showProjection, anomalies, innerWidth, innerHeight]);

  // Generate path for the line
  const linePath = useMemo(() => {
    const actualPoints = chartData.points.filter(p => !p.isProjected);
    if (actualPoints.length < 2) return "";

    return actualPoints
      .map((point, i) => (i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(" ");
  }, [chartData.points]);

  // Generate path for projected line
  const projectedPath = useMemo(() => {
    const projectedPoints = chartData.points.filter(p => p.isProjected);
    const lastActual = chartData.points.filter(p => !p.isProjected).pop();

    if (projectedPoints.length === 0 || !lastActual) return "";

    const points = [lastActual, ...projectedPoints];
    return points
      .map((point, i) => (i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(" ");
  }, [chartData.points]);

  // Generate area path for gradient fill
  const areaPath = useMemo(() => {
    const actualPoints = chartData.points.filter(p => !p.isProjected);
    if (actualPoints.length < 2) return "";

    const baseline = padding.top + innerHeight;
    return (
      actualPoints
        .map((point, i) =>
          i === 0 ? `M ${point.x} ${baseline} L ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
        )
        .join(" ") + ` L ${actualPoints[actualPoints.length - 1].x} ${baseline} Z`
    );
  }, [chartData.points, innerHeight]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    const labels = [];
    const range = chartData.maxY - chartData.minY;
    const step = range / 4;

    for (let i = 0; i <= 4; i++) {
      const value = chartData.minY + step * i;
      const y = padding.top + innerHeight - (i / 4) * innerHeight;
      labels.push({ value, y });
    }
    return labels;
  }, [chartData.minY, chartData.maxY, innerHeight]);

  // Trend line
  const trendLine = useMemo(() => {
    if (!trend || chartData.points.length < 2) return null;

    const actualPoints = chartData.points.filter(p => !p.isProjected);
    const firstX = actualPoints[0].x;
    const lastX = actualPoints[actualPoints.length - 1].x;

    const firstY = trend.startValue;
    const lastY = trend.endValue;

    const range = chartData.maxY - chartData.minY;
    const y1 = padding.top + innerHeight - ((firstY - chartData.minY) / range) * innerHeight;
    const y2 = padding.top + innerHeight - ((lastY - chartData.minY) / range) * innerHeight;

    return { x1: firstX, y1, x2: lastX, y2 };
  }, [trend, chartData, innerHeight]);

  const trendColor =
    trend?.direction === "increasing"
      ? "#22C55E"
      : trend?.direction === "decreasing"
        ? "#EF4444"
        : trend?.direction === "fluctuating"
          ? "#F59E0B"
          : "#6B7280";

  if (dataPoints.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No data to display</p>
            <p className="text-sm">Start tracking to see trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.direction === "increasing" ? (
                <TrendingUp className="h-4 w-4" style={{ color: trendColor }} />
              ) : trend.direction === "decreasing" ? (
                <TrendingDown className="h-4 w-4" style={{ color: trendColor }} />
              ) : null}
              <Badge
                variant="outline"
                className="text-xs capitalize"
                style={{ borderColor: trendColor, color: trendColor }}
              >
                {trend.direction} ({trend.percentChange > 0 ? "+" : ""}
                {trend.percentChange.toFixed(1)}%)
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height }}>
            {/* Definitions */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {showGrid && (
              <g className="text-muted-foreground/20">
                {yLabels.map((label, i) => (
                  <line
                    key={i}
                    x1={padding.left}
                    y1={label.y}
                    x2={chartWidth - padding.right}
                    y2={label.y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                  />
                ))}
              </g>
            )}

            {/* Y-axis labels */}
            {showLabels && (
              <g className="text-xs fill-muted-foreground">
                {yLabels.map((label, i) => (
                  <text key={i} x={padding.left - 8} y={label.y + 4} textAnchor="end">
                    {label.value.toFixed(1)}
                  </text>
                ))}
              </g>
            )}

            {/* Area fill */}
            <motion.path
              d={areaPath}
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Main line */}
            <motion.path
              d={linePath}
              fill="none"
              stroke={trendColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Projected line */}
            {showProjection && projectedPath && (
              <motion.path
                d={projectedPath}
                fill="none"
                stroke={trendColor}
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity={0.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              />
            )}

            {/* Trend line */}
            {trendLine && (
              <line
                x1={trendLine.x1}
                y1={trendLine.y1}
                x2={trendLine.x2}
                y2={trendLine.y2}
                stroke={trendColor}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity={0.6}
              />
            )}

            {/* Data points */}
            <TooltipProvider>
              {chartData.points.map((point, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <motion.circle
                      cx={point.x}
                      cy={point.y}
                      r={point.isAnomaly ? 6 : 4}
                      fill={
                        point.isAnomaly
                          ? point.anomalySeverity === "severe"
                            ? "#EF4444"
                            : point.anomalySeverity === "moderate"
                              ? "#F59E0B"
                              : "#FBBF24"
                          : point.isProjected
                            ? "white"
                            : trendColor
                      }
                      stroke={point.isProjected ? trendColor : "white"}
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-medium">
                        {point.value.toFixed(2)}
                        {point.isProjected && " (projected)"}
                        {point.isAnomaly && " ⚠️"}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(point.date).toLocaleDateString()}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5" style={{ backgroundColor: trendColor }} />
              <span>Actual</span>
            </div>
            {showProjection && projectedPoints.length > 0 && (
              <div className="flex items-center gap-1">
                <span
                  className="w-3 h-0.5 border-t-2 border-dashed"
                  style={{ borderColor: trendColor }}
                />
                <span>Projected</span>
              </div>
            )}
            {anomalies && anomalies.anomalies.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Anomaly</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrendChart;
