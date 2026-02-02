import type React from "react";

import type { ScanEntry, DiaryEntry } from "@/contexts/DataContext";

export type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";
export type ChartView = "trends" | "comparison" | "distribution";
export type ChartType = "line" | "area";

export type MeasurementSource = "scan" | "diary";

export interface CombinedEntry {
  date: Date;
  length?: number;
  circumference?: number;
  curvatureAngle?: number;
  source: MeasurementSource;
}

export interface ProcessedEntry extends CombinedEntry {
  dateLabel: string;
  fullDate: string;
}

export interface MetricStats {
  min: number;
  max: number;
  avg: number;
  change: number;
  stdDev: number;
}

export interface PeriodStats {
  length: MetricStats;
  circumference: MetricStats;
  curvature: MetricStats;
  count: number;
}

export interface PeriodData {
  label: string;
  data: ProcessedEntry[];
  stats: PeriodStats;
}

export interface PeriodComparison {
  length: number;
  circumference: number;
  curvature: number;
  entries: number;
}

export interface ComparisonBarRow {
  metric: "Length" | "Circumference" | "Curvature";
  current: number;
  previous: number;
  unit: "cm" | "°";
}

export type MilestoneType = "positive" | "neutral" | "negative";
export type MilestoneKind = "first_measurement" | "lowest_curvature" | "tracking_consistency";

export interface Milestone {
  kind: MilestoneKind;
  label: string;
  date: string;
  type: MilestoneType;
}

export interface ProgressChartsModel {
  allData: CombinedEntry[];
  filteredData: ProcessedEntry[];
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  periodComparison: PeriodComparison | null;
  comparisonBarData: ComparisonBarRow[];
  milestones: Milestone[];
}

export interface ProgressChartsInputs {
  scans: ScanEntry[];
  diaryEntries: DiaryEntry[];
  timeRange: TimeRange;
  showComparison: boolean;
}

export type TrendIndicatorIcon = React.ReactNode;
