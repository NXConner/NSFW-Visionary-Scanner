import React from "react";

import { Card } from "@/components/ui/card";
import { Activity, CircleDot, Target, Zap, Ruler } from "lucide-react";

import type { PeriodData } from "@/components/progressCharts/types";
import { TrendIndicator } from "@/components/progressCharts/components/Indicators";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";

export function StatsCards({
  currentPeriod,
  previousPeriod,
}: {
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
}) {
  const { measurementUnits } = useSettings();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <Ruler className="w-4 h-4 text-primary" />
          <TrendIndicator value={currentPeriod.stats.length.change} />
        </div>
        <div className="text-2xl font-bold">
          {formatLength(currentPeriod.stats.length.avg, measurementUnits)}
        </div>
        <div className="text-xs text-muted-foreground">Avg Length</div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span
            className={
              currentPeriod.stats.length.change > 0
                ? "text-success"
                : currentPeriod.stats.length.change < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
          >
            {currentPeriod.stats.length.change > 0 ? "+" : ""}
            {formatLength(currentPeriod.stats.length.change, measurementUnits)}
          </span>
          <span className="text-muted-foreground">
            {formatLength(currentPeriod.stats.length.min, measurementUnits)}-
            {formatLength(currentPeriod.stats.length.max, measurementUnits)}
          </span>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <CircleDot className="w-4 h-4 text-accent" />
          <TrendIndicator value={currentPeriod.stats.circumference.change} />
        </div>
        <div className="text-2xl font-bold">
          {formatLength(currentPeriod.stats.circumference.avg, measurementUnits)}
        </div>
        <div className="text-xs text-muted-foreground">Avg Circumference</div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span
            className={
              currentPeriod.stats.circumference.change > 0
                ? "text-success"
                : currentPeriod.stats.circumference.change < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
          >
            {currentPeriod.stats.circumference.change > 0 ? "+" : ""}
            {formatLength(currentPeriod.stats.circumference.change, measurementUnits)}
          </span>
          <span className="text-muted-foreground">
            {formatLength(currentPeriod.stats.circumference.min, measurementUnits)}-
            {formatLength(currentPeriod.stats.circumference.max, measurementUnits)}
          </span>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <Target className="w-4 h-4 text-warning" />
          <TrendIndicator value={currentPeriod.stats.curvature.change} inverse />
        </div>
        <div className="text-2xl font-bold">{currentPeriod.stats.curvature.avg}°</div>
        <div className="text-xs text-muted-foreground">Avg Curvature</div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span
            className={
              currentPeriod.stats.curvature.change < 0
                ? "text-success"
                : currentPeriod.stats.curvature.change > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
          >
            {currentPeriod.stats.curvature.change > 0 ? "+" : ""}
            {currentPeriod.stats.curvature.change}°
          </span>
          <span className="text-muted-foreground">
            {currentPeriod.stats.curvature.min}°-{currentPeriod.stats.curvature.max}°
          </span>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <Activity className="w-4 h-4 text-success" />
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="text-2xl font-bold">{currentPeriod.stats.count}</div>
        <div className="text-xs text-muted-foreground">Total Entries</div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>This period</span>
          <span>{previousPeriod.stats.count} prev</span>
        </div>
      </Card>
    </div>
  );
}
