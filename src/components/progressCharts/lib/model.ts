import { differenceInDays, format, isAfter, isBefore, subDays, subMonths } from "date-fns";

import type { DiaryEntry, ScanEntry } from "@/contexts/DataContext";
import type {
  CombinedEntry,
  ComparisonBarRow,
  PeriodComparison,
  PeriodData,
  PeriodStats,
  ProcessedEntry,
  ProgressChartsInputs,
  ProgressChartsModel,
  TimeRange,
  Milestone,
} from "@/components/progressCharts/types";

const calcMetric = (arr: number[]): PeriodStats["length"] => {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0, change: 0, stdDev: 0 };
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const avgRaw = arr.reduce((a, b) => a + b, 0) / arr.length;
  const changeRaw = arr.length > 1 ? arr[arr.length - 1] - arr[0] : 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avgRaw, 2), 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  return {
    min,
    max,
    avg: +avgRaw.toFixed(1),
    change: +changeRaw.toFixed(1),
    stdDev: +stdDev.toFixed(2),
  };
};

export function buildAllData(scans: ScanEntry[], diaryEntries: DiaryEntry[]): CombinedEntry[] {
  const scanData: CombinedEntry[] = scans.map(s => ({
    date: new Date(s.created_at),
    length: s.length,
    circumference: s.circumference,
    curvatureAngle: s.curvature_angle,
    source: "scan",
  }));

  const diaryData: CombinedEntry[] = diaryEntries
    .filter(d => d.length || d.circumference || d.curvature_angle)
    .map(d => ({
      date: new Date(d.entry_date),
      length: d.length ?? undefined,
      circumference: d.circumference ?? undefined,
      curvatureAngle: d.curvature_angle ?? undefined,
      source: "diary",
    }));

  return [...scanData, ...diaryData].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getDateRanges(range: TimeRange) {
  const now = new Date();
  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (range) {
    case "7d":
      currentStart = subDays(now, 7);
      previousEnd = subDays(now, 7);
      previousStart = subDays(now, 14);
      break;
    case "30d":
      currentStart = subDays(now, 30);
      previousEnd = subDays(now, 30);
      previousStart = subDays(now, 60);
      break;
    case "90d":
      currentStart = subMonths(now, 3);
      previousEnd = subMonths(now, 3);
      previousStart = subMonths(now, 6);
      break;
    case "6m":
      currentStart = subMonths(now, 6);
      previousEnd = subMonths(now, 6);
      previousStart = subMonths(now, 12);
      break;
    case "1y":
      currentStart = subMonths(now, 12);
      previousEnd = subMonths(now, 12);
      previousStart = subMonths(now, 24);
      break;
    default:
      currentStart = new Date(0);
      previousStart = new Date(0);
      previousEnd = new Date(0);
  }

  return { now, currentStart, previousStart, previousEnd };
}

export function processData(data: CombinedEntry[]): ProcessedEntry[] {
  return data.map(e => ({
    ...e,
    dateLabel: format(e.date, "MMM d"),
    fullDate: format(e.date, "MMM d, yyyy"),
  }));
}

export function calcStats(data: CombinedEntry[]): PeriodStats {
  const lengths = data.map(d => d.length).filter((v): v is number => typeof v === "number");
  const circumferences = data
    .map(d => d.circumference)
    .filter((v): v is number => typeof v === "number");
  const angles = data.map(d => d.curvatureAngle).filter((v): v is number => typeof v === "number");

  return {
    length: calcMetric(lengths),
    circumference: calcMetric(circumferences),
    curvature: calcMetric(angles),
    count: data.length,
  };
}

export function buildPeriods(
  allData: CombinedEntry[],
  timeRange: TimeRange,
): Pick<ProgressChartsModel, "currentPeriod" | "previousPeriod" | "filteredData"> {
  const { currentStart, previousStart, previousEnd } = getDateRanges(timeRange);

  const currentData = allData.filter(e => isAfter(e.date, currentStart));
  const previousData =
    timeRange !== "all"
      ? allData.filter(e => isAfter(e.date, previousStart) && isBefore(e.date, previousEnd))
      : [];

  const currentPeriod: PeriodData = {
    label: "Current",
    data: processData(currentData),
    stats: calcStats(currentData),
  };
  const previousPeriod: PeriodData = {
    label: "Previous",
    data: processData(previousData),
    stats: calcStats(previousData),
  };

  return {
    currentPeriod,
    previousPeriod,
    filteredData: currentPeriod.data,
  };
}

export function buildPeriodComparison(
  currentPeriod: PeriodData,
  previousPeriod: PeriodData,
  showComparison: boolean,
): PeriodComparison | null {
  if (!showComparison || previousPeriod.stats.count === 0) return null;

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return +(((current - previous) / previous) * 100).toFixed(1);
  };

  return {
    length: calcChange(currentPeriod.stats.length.avg, previousPeriod.stats.length.avg),
    circumference: calcChange(
      currentPeriod.stats.circumference.avg,
      previousPeriod.stats.circumference.avg,
    ),
    curvature: calcChange(currentPeriod.stats.curvature.avg, previousPeriod.stats.curvature.avg),
    entries: currentPeriod.stats.count - previousPeriod.stats.count,
  };
}

export function buildComparisonBarData(
  currentPeriod: PeriodData,
  previousPeriod: PeriodData,
): ComparisonBarRow[] {
  return [
    {
      metric: "Length",
      current: currentPeriod.stats.length.avg,
      previous: previousPeriod.stats.length.avg,
      unit: "cm",
    },
    {
      metric: "Circumference",
      current: currentPeriod.stats.circumference.avg,
      previous: previousPeriod.stats.circumference.avg,
      unit: "cm",
    },
    {
      metric: "Curvature",
      current: currentPeriod.stats.curvature.avg,
      previous: previousPeriod.stats.curvature.avg,
      unit: "°",
    },
  ];
}

export function buildMilestones(allData: CombinedEntry[]): Milestone[] {
  if (allData.length < 2) return [];

  const achievements: Milestone[] = [];

  // First measurement
  achievements.push({
    kind: "first_measurement",
    label: "First measurement recorded",
    date: format(allData[0].date, "MMM d, yyyy"),
    type: "positive",
  });

  // Lowest curvature
  const curvatures = allData
    .filter(d => typeof d.curvatureAngle === "number")
    .map(d => ({ angle: d.curvatureAngle as number, date: d.date }));
  if (curvatures.length > 0) {
    const lowest = curvatures.reduce((min, c) => (c.angle < min.angle ? c : min));
    achievements.push({
      kind: "lowest_curvature",
      label: `Lowest curvature: ${lowest.angle}°`,
      date: format(lowest.date, "MMM d, yyyy"),
      type: "positive",
    });
  }

  // Most consistent tracking
  const daysTracked = differenceInDays(allData[allData.length - 1].date, allData[0].date);
  if (daysTracked > 0) {
    const trackingRate = ((allData.length / daysTracked) * 100).toFixed(0);
    achievements.push({
      kind: "tracking_consistency",
      label: `${trackingRate}% tracking consistency`,
      date: `${allData.length} entries over ${daysTracked} days`,
      type: Number.parseInt(trackingRate, 10) > 50 ? "positive" : "neutral",
    });
  }

  return achievements.slice(0, 4);
}

export function buildProgressChartsModel({
  scans,
  diaryEntries,
  timeRange,
  showComparison,
}: ProgressChartsInputs): ProgressChartsModel {
  const allData = buildAllData(scans, diaryEntries);
  const { currentPeriod, previousPeriod, filteredData } = buildPeriods(allData, timeRange);
  const periodComparison = buildPeriodComparison(currentPeriod, previousPeriod, showComparison);
  const comparisonBarData = buildComparisonBarData(currentPeriod, previousPeriod);
  const milestones = buildMilestones(allData);

  return {
    allData,
    filteredData,
    currentPeriod,
    previousPeriod,
    periodComparison,
    comparisonBarData,
    milestones,
  };
}
