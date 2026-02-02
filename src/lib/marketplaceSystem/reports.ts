import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { CustomReport, JsonObject } from "./types";

// Local storage for custom reports (no database table)
const REPORTS_KEY = "custom_reports";

function getStoredReports(): CustomReport[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: CustomReport[]): void {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

export async function generateCustomReport(
  reportType: CustomReport["report_type"],
  reportName: string,
  reportConfig: JsonObject,
  dataSources: string[],
  fileFormat: CustomReport["file_format"] = "pdf",
): Promise<CustomReport | null> {
  try {
    const price = reportType === "medical_export" ? 9.99 : 0;
    const paymentStatus: CustomReport["payment_status"] = price > 0 ? "pending" : "paid";

    const newReport: CustomReport = {
      id: crypto.randomUUID(),
      user_id: "local",
      report_type: reportType,
      report_name: reportName,
      report_config: reportConfig,
      data_sources: dataSources,
      price,
      currency: "USD",
      payment_status: paymentStatus,
      payment_intent_id: null,
      generation_status: "pending",
      file_format: fileFormat,
      file_url: null,
      file_size_bytes: null,
      generated_at: null,
      is_shared: false,
      shared_with: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const reports = getStoredReports();
    reports.unshift(newReport);
    saveReports(reports);

    toast.success("Report request created");
    return newReport;
  } catch (err) {
    logger.error("Error generating report", { error: err });
    toast.error("Failed to generate report");
    return null;
  }
}

export async function getUserReports(): Promise<CustomReport[]> {
  try {
    return getStoredReports();
  } catch (err) {
    logger.error("Error getting user reports", { error: err });
    return [];
  }
}
