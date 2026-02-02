import { memo, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { differenceInDays, format, isAfter, subDays, subMonths } from "date-fns";
import { GitCompare } from "lucide-react";
import type { ScanEntry, TimeRange } from "./types";
import { HeaderControls } from "./sections/HeaderControls";
import { StatsGrid, type StatsSummary } from "./sections/StatsGrid";
import { MetricToggles } from "./sections/MetricToggles";
import { TrendsChart } from "./sections/TrendsChart";
import { EntryComparison, type ComparisonData } from "./sections/EntryComparison";
import { Milestones } from "./sections/Milestones";

export const ScanHistoryComparison = memo((): JSX.Element => {
  const { scans, diaryEntries } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [showLength, setShowLength] = useState(true);
  const [showCircumference, setShowCircumference] = useState(true);
  const [showCurvature, setShowCurvature] = useState(true);

  const allData = useMemo<ScanEntry[]>(() => {
    const combined: ScanEntry[] = [
      ...scans.map(s => ({
        id: s.id,
        date: new Date(s.created_at),
        dateLabel: format(new Date(s.created_at), "MMM d"),
        fullDate: format(new Date(s.created_at), "MMM d, yyyy HH:mm"),
        length: s.length,
        circumference: s.circumference,
        curvatureAngle: s.curvature_angle,
        source: "scan" as const,
      })),
      ...diaryEntries
        .filter(d => Boolean(d.length || d.circumference || d.curvature_angle))
        .map(d => ({
          id: d.id,
          date: new Date(d.entry_date),
          dateLabel: format(new Date(d.entry_date), "MMM d"),
          fullDate: format(new Date(d.entry_date), "MMM d, yyyy"),
          length: d.length,
          circumference: d.circumference,
          curvatureAngle: d.curvature_angle,
          source: "diary" as const,
        })),
    ];

    return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scans, diaryEntries]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date;

    switch (timeRange) {
      case "7d":
        cutoff = subDays(now, 7);
        break;
      case "30d":
        cutoff = subDays(now, 30);
        break;
      case "90d":
        cutoff = subMonths(now, 3);
        break;
      case "6m":
        cutoff = subMonths(now, 6);
        break;
      case "1y":
        cutoff = subMonths(now, 12);
        break;
      default:
        cutoff = new Date(0);
    }

    return allData.filter(e => isAfter(e.date, cutoff));
  }, [allData, timeRange]);

  const stats = useMemo<StatsSummary>(() => {
    const calc = (arr: Array<number | null>) => {
      const valid = arr.filter((v): v is number => v !== null && v !== undefined);
      if (valid.length === 0) return { min: 0, max: 0, avg: 0, change: 0, first: 0, last: 0 };
      return {
        min: Math.min(...valid),
        max: Math.max(...valid),
        avg: valid.reduce((a, b) => a + b, 0) / valid.length,
        change: valid.length > 1 ? valid[valid.length - 1] - valid[0] : 0,
        first: valid[0],
        last: valid[valid.length - 1],
      };
    };

    return {
      length: calc(filteredData.map(d => d.length)),
      circumference: calc(filteredData.map(d => d.circumference)),
      curvature: calc(filteredData.map(d => d.curvatureAngle)),
      totalEntries: filteredData.length,
      daysCovered:
        filteredData.length > 1
          ? differenceInDays(filteredData[filteredData.length - 1]!.date, filteredData[0]!.date)
          : 0,
    };
  }, [filteredData]);

  const rateOfChange = useMemo(() => {
    if (stats.daysCovered === 0) return { length: 0, circumference: 0, curvature: 0 };
    return {
      length: (stats.length.change / stats.daysCovered) * 30,
      circumference: (stats.circumference.change / stats.daysCovered) * 30,
      curvature: (stats.curvature.change / stats.daysCovered) * 30,
    };
  }, [stats]);

  const comparisonData = useMemo<ComparisonData | null>(() => {
    if (selectedScans.length < 2) return null;
    const selected = selectedScans
      .map(id => filteredData.find(d => d.id === id))
      .filter((v): v is ScanEntry => Boolean(v));
    if (selected.length < 2) return null;
    const first = selected[0]!;
    const second = selected[selected.length - 1]!;
    return {
      first,
      second,
      daysBetween: differenceInDays(second.date, first.date),
      lengthDiff: (second.length ?? 0) - (first.length ?? 0),
      circumferenceDiff: (second.circumference ?? 0) - (first.circumference ?? 0),
      curvatureDiff: (second.curvatureAngle ?? 0) - (first.curvatureAngle ?? 0),
    };
  }, [selectedScans, filteredData]);

  if (filteredData.length < 2) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <GitCompare className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Not Enough Data</h3>
          <p className="text-muted-foreground max-w-md">
            Record at least 2 measurements to see comparison charts and track your progress over
            time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderControls
        totalEntries={stats.totalEntries}
        daysCovered={stats.daysCovered}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      <StatsGrid stats={stats} rateOfChange={rateOfChange} />

      <MetricToggles
        showLength={showLength}
        showCircumference={showCircumference}
        showCurvature={showCurvature}
        onToggleLength={() => setShowLength(!showLength)}
        onToggleCircumference={() => setShowCircumference(!showCircumference)}
        onToggleCurvature={() => setShowCurvature(!showCurvature)}
      />

      <TrendsChart
        data={filteredData}
        showLength={showLength}
        showCircumference={showCircumference}
        showCurvature={showCurvature}
      />

      <EntryComparison
        data={filteredData}
        selectedScans={selectedScans}
        onSelectScans={setSelectedScans}
        comparisonData={comparisonData}
      />

      <Milestones
        totalEntries={stats.totalEntries}
        daysCovered={stats.daysCovered}
        curvatureFirst={stats.curvature.first}
        curvatureLast={stats.curvature.last}
      />
    </div>
  );
});

ScanHistoryComparison.displayName = "ScanHistoryComparison";
