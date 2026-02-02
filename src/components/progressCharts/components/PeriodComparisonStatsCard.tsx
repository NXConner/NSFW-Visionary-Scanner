import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CircleDot, GitCompare, Ruler, Target } from "lucide-react";

import type { PeriodComparison, PeriodData, TimeRange } from "@/components/progressCharts/types";
import { PercentBadge } from "@/components/progressCharts/components/Indicators";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";

export function PeriodComparisonStatsCard({
  show,
  periodComparison,
  currentPeriod,
  timeRange,
}: {
  show: boolean;
  periodComparison: PeriodComparison | null;
  currentPeriod: PeriodData;
  timeRange: TimeRange;
}) {
  const { measurementUnits } = useSettings();
  if (!show || !periodComparison) return null;

  return (
    <Card className="glass-card border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Period Comparison</span>
          <Badge variant="outline" className="text-[10px]">
            vs previous {timeRange}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Ruler className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Length</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatLength(currentPeriod.stats.length.avg, measurementUnits)}
              </span>
              <PercentBadge value={periodComparison.length} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CircleDot className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Circumference</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatLength(currentPeriod.stats.circumference.avg, measurementUnits)}
              </span>
              <PercentBadge value={periodComparison.circumference} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Curvature</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{currentPeriod.stats.curvature.avg}°</span>
              <PercentBadge value={periodComparison.curvature} inverse />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{currentPeriod.stats.count}</span>
              <Badge variant="outline" className="text-[10px]">
                {periodComparison.entries >= 0 ? "+" : ""}
                {periodComparison.entries}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
