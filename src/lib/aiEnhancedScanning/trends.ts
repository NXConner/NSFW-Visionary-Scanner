import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { HealthTrendVisualization } from "./types";
import { requireUserId } from "./utils";

export async function generateHealthTrendVisualization(
  visualizationType: HealthTrendVisualization["visualization_type"],
  timePeriodDays?: number,
): Promise<HealthTrendVisualization | null> {
  try {
    const userId = await requireUserId();
    if (!userId) return null;

    const days = timePeriodDays ?? 90;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    const { data: scans, error } = await supabase
      .from("scans")
      .select("scanned_at,created_at,length,girth,overall_health,confidence_level")
      .eq("user_id", userId)
      .gte("scanned_at", cutoff)
      .order("scanned_at", { ascending: true });
    if (error) throw error;

    const points = (scans || []).map(s => ({
      t:
        (s as { scanned_at?: string | null; created_at?: string | null }).scanned_at ||
        (s as { created_at?: string | null }).created_at,
      length: (s as { length?: number | null }).length,
      girth: (s as { girth?: number | null }).girth,
      confidence: (s as { confidence_level?: number | null }).confidence_level,
    }));

    const trend_data = { points };
    const insights: string[] = [];
    if (points.length < 2) insights.push("Not enough data points to determine trends.");

    const { data, error: insErr } = await supabase
      .from("health_trend_visualizations")
      .insert({
        user_id: userId,
        visualization_type: visualizationType,
        trend_data,
        time_period_days: days,
        data_points: points,
        chart_image_url: null,
        chart_config: null,
        insights,
        predictions: null,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    toast.success("Trend visualization generated!");
    return data as HealthTrendVisualization;
  } catch (error) {
    logger.error("AIEnhancedScanning: generate trend failed", { error });
    toast.error("Failed to generate visualization");
    return null;
  }
}
