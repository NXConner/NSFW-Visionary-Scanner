import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type jsPDF from "jspdf";
import type { ChartConfig, ColorScheme, CustomReport, DateRange, ReportConfig } from "./types";
import { buildMetricSeries, computeSnapshot, fetchScansInRange } from "./metrics";

// Local storage key for reports
const REPORTS_STORAGE_KEY = "custom_reports";

function getStoredReports(): CustomReport[] {
  try {
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveReportsToStorage(reports: CustomReport[]): void {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

function defaultReportConfig(overrides?: Partial<ReportConfig>): ReportConfig {
  return {
    include_charts: true,
    include_tables: true,
    include_summary: true,
    include_recommendations: true,
    page_size: "a4",
    orientation: "portrait",
    ...overrides,
  };
}

function defaultColorScheme(overrides?: ColorScheme): ColorScheme {
  return (
    overrides || {
      primary: "#3B82F6",
      secondary: "#10B981",
      accent: "#F59E0B",
      background: "#FFFFFF",
      text: "#1F2937",
    }
  );
}

function defaultChartTypes(): ChartConfig {
  return {
    progress_chart: "line",
    comparison_chart: "bar",
    distribution_chart: "doughnut",
  };
}

export async function createCustomReport(
  reportName: string,
  reportType: CustomReport["report_type"],
  selectedMetrics: string[],
  dateRange: DateRange,
  config?: Partial<ReportConfig>,
  theme?: CustomReport["theme"],
  colorScheme?: ColorScheme,
): Promise<CustomReport | null> {
  try {
    const report: CustomReport = {
      id: crypto.randomUUID(),
      user_id: "local",
      report_name: reportName,
      report_type: reportType,
      report_config: defaultReportConfig(config),
      selected_metrics: selectedMetrics,
      date_range: dateRange,
      theme: theme || "professional",
      color_scheme: defaultColorScheme(colorScheme),
      chart_types: defaultChartTypes(),
      is_favorite: false,
      is_scheduled: false,
      generation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const reports = getStoredReports();
    reports.unshift(report);
    saveReportsToStorage(reports);

    toast.success("Report created");
    return report;
  } catch (error) {
    logger.error("createCustomReport error", { error });
    toast.error("Failed to create report");
    return null;
  }
}

export async function getCustomReports(favoritesOnly?: boolean): Promise<CustomReport[]> {
  try {
    const reports = getStoredReports();
    if (favoritesOnly) {
      return reports.filter(r => r.is_favorite);
    }
    return reports;
  } catch (error) {
    logger.error("getCustomReports error", { error });
    return [];
  }
}

export async function scheduleReport(
  reportId: string,
  frequency: "daily" | "weekly" | "monthly",
  day?: number,
  time?: string,
): Promise<boolean> {
  try {
    const reports = getStoredReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) {
      toast.error("Report not found");
      return false;
    }

    const next = calculateNextScheduledDate(frequency, day, time);
    reports[index] = {
      ...reports[index],
      is_scheduled: true,
      schedule_frequency: frequency,
      schedule_day: day ?? null,
      schedule_time: time ?? null,
      next_scheduled_at: next,
      updated_at: new Date().toISOString(),
    };
    saveReportsToStorage(reports);

    toast.success("Report scheduled");
    return true;
  } catch (error) {
    logger.error("scheduleReport error", { error });
    return false;
  }
}

export async function generateReport(reportId: string): Promise<string | null> {
  try {
    const reports = getStoredReports();
    const report = reports.find(r => r.id === reportId);

    if (!report) {
      toast.error("Report not found");
      return null;
    }

    const scans = await fetchScansInRange(report.date_range);
    const snapshot = computeSnapshot(scans);

    const { default: jsPDFCtor } = await import("jspdf");
    const doc: jsPDF = new jsPDFCtor({
      orientation: report.report_config.orientation,
      unit: "mm",
      format: report.report_config.page_size,
    });

    doc.setFontSize(18);
    doc.text(report.report_name, 20, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Type: ${report.report_type}`, 20, 36);
    doc.text(`Scans in range: ${snapshot.scan_count}`, 20, 42);

    let y = 54;
    doc.setFontSize(12);
    doc.text("Summary", 20, y);
    y += 8;

    const summaryLines: string[] = [];
    if (snapshot.length_avg != null)
      summaryLines.push(`Avg Length: ${snapshot.length_avg.toFixed(2)} in`);
    if (snapshot.girth_avg != null)
      summaryLines.push(`Avg Girth: ${snapshot.girth_avg.toFixed(2)} in`);
    if (snapshot.erect_length_avg != null)
      summaryLines.push(`Avg Erect Length: ${snapshot.erect_length_avg.toFixed(2)} in`);
    if (snapshot.erect_girth_avg != null)
      summaryLines.push(`Avg Erect Girth: ${snapshot.erect_girth_avg.toFixed(2)} in`);
    if (snapshot.eq_score_avg != null)
      summaryLines.push(`Avg EQ Score: ${snapshot.eq_score_avg.toFixed(0)}%`);
    if (snapshot.hardness_avg != null)
      summaryLines.push(`Avg Hardness: ${snapshot.hardness_avg.toFixed(1)}`);

    if (summaryLines.length === 0)
      summaryLines.push("No numeric metrics available in this date range yet.");

    summaryLines.forEach(line => {
      doc.setFontSize(10);
      doc.text(line, 20, y);
      y += 6;
    });

    if (report.report_config.include_tables) {
      y += 6;
      doc.setFontSize(12);
      doc.text("Selected Metrics (trend points)", 20, y);
      y += 8;

      for (const metric of report.selected_metrics) {
        const series = buildMetricSeries(scans, metric);
        const latest = series.length ? series[series.length - 1] : null;
        const label = latest
          ? `${metric}: latest ${latest.value} (${new Date(latest.date).toLocaleDateString()})`
          : `${metric}: no data`;
        doc.setFontSize(10);
        doc.text(label, 20, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 22;
        }
      }
    }

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    // Update generation count
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index] = {
        ...reports[index],
        generation_count: (reports[index].generation_count ?? 0) + 1,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveReportsToStorage(reports);
    }

    toast.success("Report generated");
    return url;
  } catch (error) {
    logger.error("generateReport error", { error });
    toast.error("Failed to generate report");
    return null;
  }
}

function calculateNextScheduledDate(
  frequency: "daily" | "weekly" | "monthly",
  day?: number,
  time?: string,
): string {
  const now = new Date();
  const next = new Date(now);

  if (time) {
    const [hh, mm] = time.split(":").map(x => Number(x));
    if (Number.isFinite(hh)) next.setHours(hh, Number.isFinite(mm) ? mm : 0, 0, 0);
  }

  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    const target = typeof day === "number" ? day : 1;
    const current = next.getDay();
    const delta = (target - current + 7) % 7 || 7;
    next.setDate(next.getDate() + delta);
  } else {
    const targetDay = typeof day === "number" ? day : 1;
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(targetDay, 28));
  }

  return next.toISOString();
}
