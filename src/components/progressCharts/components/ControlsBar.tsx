import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";

import type { ChartView, TimeRange } from "@/components/progressCharts/types";

export function ControlsBar({
  timeRange,
  onTimeRangeChange,
  chartView,
  onChartViewChange,
  entriesCount,
}: {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  chartView: ChartView;
  onChartViewChange: (view: ChartView) => void;
  entriesCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Progress Analysis</h3>
        <Badge variant="outline" className="ml-2">
          {entriesCount} entries
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={timeRange} onValueChange={v => onTimeRangeChange(v as TimeRange)}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={chartView} onValueChange={v => onChartViewChange(v as ChartView)}>
          <TabsList className="h-9">
            <TabsTrigger value="trends" className="text-xs px-3">
              Trends
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs px-3">
              Compare
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
