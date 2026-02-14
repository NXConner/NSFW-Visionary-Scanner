import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { db, daysAgoIso, requireUser, todayIso } from "./common";
import type { NSFWSexualFunctionTracking } from "./types";

export async function trackSexualFunction(
  entryDate: string,
  data: Partial<NSFWSexualFunctionTracking>,
): Promise<NSFWSexualFunctionTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      entry_time: data.entry_time ?? null,
      activity_type: data.activity_type ?? null,
      erectile_function_score: data.erectile_function_score ?? null,
      erection_quality: data.erection_quality ?? null,
      erection_duration_minutes: data.erection_duration_minutes ?? null,
      erection_stability: data.erection_stability ?? null,
      stamina_minutes: data.stamina_minutes ?? null,
      control_level: data.control_level ?? null,
      recovery_time_minutes: data.recovery_time_minutes ?? null,
      // DB schema treats this as boolean (unknown -> false)
      partner_present: Boolean(data.partner_present),
      environment: data.environment ?? null,
      factors_affecting: data.factors_affecting ?? null,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await db("nsfw_sexual_function_tracking")
      .upsert(payload, { onConflict: "user_id,entry_date" })
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackSexualFunction failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWSexualFunctionTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackSexualFunction error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getSexualFunctionTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWSexualFunctionTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await db("nsfw_sexual_function_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getSexualFunctionTracking failed", { error: error.message });
      return [];
    }

    return (data || []) as NSFWSexualFunctionTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getSexualFunctionTracking error", { error });
    return [];
  }
}
