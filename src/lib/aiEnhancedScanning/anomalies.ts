import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { AnomalyDetection } from "./types";
import { clamp01, getScan, requireUserId } from "./utils";

function median(arr: number[]): number {
  const a = [...arr].sort((x, y) => x - y);
  if (a.length === 0) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2;
}

export async function detectAnomalies(scanId: string): Promise<AnomalyDetection[]> {
  try {
    const userId = await requireUserId();
    if (!userId) return [];
    const scan = await getScan(scanId);
    if (!scan || scan.user_id !== userId) return [];

    const { data: recent, error } = await supabase
      .from("scans")
      .select("id,length,girth,scanned_at,created_at")
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false })
      .limit(30);
    if (error) throw error;

    const series = (recent || []) as unknown as Array<{
      id: string;
      length: number | null;
      girth: number | null;
    }>;
    const lengths = series.map(s => s.length).filter((v): v is number => typeof v === "number");
    const girths = series.map(s => s.girth).filter((v): v is number => typeof v === "number");

    const lenMed = median(lengths);
    const girMed = median(girths);

    const anomalies: Array<{
      scan_id: string;
      user_id: string;
      anomaly_type: string;
      severity: string;
      confidence: number;
      description: string;
      location: null;
      affected_measurements: string[];
      compared_to_previous: boolean;
      deviation_amount: number;
      recommendation: string;
      requires_attention: boolean;
      is_reviewed: boolean;
    }> = [];

    if (scan.length != null && lenMed > 0) {
      const dev = Math.abs(scan.length - lenMed);
      if (dev >= 1.5) {
        anomalies.push({
          scan_id: scanId,
          user_id: userId,
          anomaly_type: "measurement_outlier",
          severity: dev >= 3 ? "high" : "medium",
          confidence: clamp01(0.7),
          description: `Length deviates from your median by ${dev.toFixed(2)}.`,
          location: null,
          affected_measurements: ["length"],
          compared_to_previous: false,
          deviation_amount: dev,
          recommendation: "Confirm with another scan under consistent conditions.",
          requires_attention: dev >= 3,
          is_reviewed: false,
        });
      }
    }

    if (scan.girth != null && girMed > 0) {
      const dev = Math.abs(scan.girth - girMed);
      if (dev >= 1.0) {
        anomalies.push({
          scan_id: scanId,
          user_id: userId,
          anomaly_type: "measurement_outlier",
          severity: dev >= 2 ? "high" : "medium",
          confidence: clamp01(0.7),
          description: `Girth deviates from your median by ${dev.toFixed(2)}.`,
          location: null,
          affected_measurements: ["girth"],
          compared_to_previous: false,
          deviation_amount: dev,
          recommendation: "Confirm with another scan under consistent conditions.",
          requires_attention: dev >= 2,
          is_reviewed: false,
        });
      }
    }

    if (anomalies.length === 0) return [];

    const { data: inserted, error: insErr } = await supabase
      .from("anomaly_detection_log")
      .insert(anomalies)
      .select("*");
    if (insErr) throw insErr;
    return (inserted || []) as unknown as AnomalyDetection[];
  } catch (error) {
    logger.error("AIEnhancedScanning: detectAnomalies failed", { error });
    toast.error("Failed to detect anomalies");
    return [];
  }
}

export async function getAnomalies(scanId?: string): Promise<AnomalyDetection[]> {
  try {
    const userId = await requireUserId();
    if (!userId) return [];
    let q = supabase
      .from("anomaly_detection_log")
      .select("*")
      .eq("user_id", userId)
      .order("detected_at", { ascending: false });
    if (scanId) q = q.eq("scan_id", scanId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as AnomalyDetection[];
  } catch (error) {
    logger.error("AIEnhancedScanning: getAnomalies failed", { error });
    return [];
  }
}
