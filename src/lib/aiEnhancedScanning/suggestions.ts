import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { MeasurementSuggestion } from "./types";
import { requireUserId } from "./utils";

export async function getMeasurementSuggestions(scanId: string): Promise<MeasurementSuggestion[]> {
  try {
    const userId = await requireUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from("measurement_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("scan_id", scanId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as MeasurementSuggestion[];
  } catch (error) {
    logger.error("AIEnhancedScanning: failed to fetch suggestions", { error });
    return [];
  }
}

export async function applyMeasurementSuggestion(suggestionId: string): Promise<boolean> {
  try {
    const userId = await requireUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from("measurement_suggestions")
      .update({ is_applied: true, applied_at: new Date().toISOString() })
      .eq("id", suggestionId)
      .eq("user_id", userId);
    if (error) throw error;
    toast.success("Suggestion applied");
    return true;
  } catch (error) {
    logger.error("AIEnhancedScanning: failed to apply suggestion", { error });
    toast.error("Failed to apply suggestion");
    return false;
  }
}
