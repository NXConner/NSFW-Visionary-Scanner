import { logger } from "@/lib/logger";
import type { ReportTemplate } from "./types";

// Default report templates (no database dependency)
const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "progress-weekly",
    template_name: "Weekly Progress Report",
    description: "Track your weekly progress with measurements and trends",
    template_type: "progress",
    default_metrics: ["length", "girth", "eq_score"],
    default_config: {
      include_charts: true,
      include_tables: true,
      include_summary: true,
      include_recommendations: true,
      page_size: "a4",
      orientation: "portrait",
    },
    is_system_template: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "health-monthly",
    template_name: "Monthly Health Summary",
    description: "Comprehensive monthly health overview",
    template_type: "health",
    default_metrics: ["length", "girth", "erect_length", "erect_girth", "hardness"],
    default_config: {
      include_charts: true,
      include_tables: true,
      include_summary: true,
      include_recommendations: true,
      page_size: "a4",
      orientation: "portrait",
    },
    is_system_template: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "comparison-baseline",
    template_name: "Baseline Comparison",
    description: "Compare current measurements against your baseline",
    template_type: "comparison",
    default_metrics: ["length", "girth"],
    default_config: {
      include_charts: true,
      include_tables: true,
      include_summary: true,
      include_recommendations: false,
      page_size: "a4",
      orientation: "landscape",
    },
    is_system_template: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  try {
    // Return default templates (no database dependency)
    return DEFAULT_TEMPLATES;
  } catch (error) {
    logger.error("getReportTemplates error", { error });
    return [];
  }
}
