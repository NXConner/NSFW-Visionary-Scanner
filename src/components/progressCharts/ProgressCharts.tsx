import React, { useMemo, useState } from "react";

import { useData } from "@/contexts/DataContext";

import { buildProgressChartsModel } from "@/components/progressCharts/lib/model";
import type { ChartType, ChartView, TimeRange } from "@/components/progressCharts/types";
import {
  CompareToggle,
  ControlsBar,
  CurvatureCard,
  MilestonesCard,
  PeriodComparisonCard,
  PeriodComparisonStatsCard,
  ProgressChartsEmptyState,
  StatsCards,
  MeasurementTrendsCard,
} from "@/components/progressCharts/components";

export const ProgressCharts = () => {
  const { scans, diaryEntries } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [chartView, setChartView] = useState<ChartView>("trends");
  const [showComparison, setShowComparison] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);

  const model = useMemo(
    () => buildProgressChartsModel({ scans, diaryEntries, timeRange, showComparison }),
    [scans, diaryEntries, timeRange, showComparison],
  );

  if (model.filteredData.length < 2) return <ProgressChartsEmptyState />;

  return (
    <div className="space-y-6">
      <ControlsBar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        chartView={chartView}
        onChartViewChange={setChartView}
        entriesCount={model.currentPeriod.stats.count}
      />

      {timeRange !== "all" && chartView === "trends" && (
        <CompareToggle show={showComparison} onChange={setShowComparison} />
      )}

      <PeriodComparisonStatsCard
        show={showComparison && chartView === "trends"}
        periodComparison={model.periodComparison}
        currentPeriod={model.currentPeriod}
        timeRange={timeRange}
      />

      <StatsCards currentPeriod={model.currentPeriod} previousPeriod={model.previousPeriod} />

      <MilestonesCard
        milestones={model.milestones}
        show={showMilestones}
        onHide={() => setShowMilestones(false)}
      />

      {chartView === "trends" && (
        <>
          <MeasurementTrendsCard
            filteredData={model.filteredData}
            chartType={chartType}
            onChartTypeChange={setChartType}
          />
          <CurvatureCard filteredData={model.filteredData} />
        </>
      )}

      {chartView === "comparison" && (
        <PeriodComparisonCard
          comparisonBarData={model.comparisonBarData}
          previousPeriod={model.previousPeriod}
          timeRange={timeRange}
        />
      )}
    </div>
  );
};

export default ProgressCharts;
