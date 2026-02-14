import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { db, daysAgoIso, requireUser, todayIso } from "./common";
import type { NSFWFrequencyTracking } from "./types";

export async function trackFrequency(
  periodStart: string,
  periodEnd: string,
  periodType: "weekly" | "monthly",
  soloCount: number,
  partnerCount: number,
): Promise<NSFWFrequencyTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const solo = Math.max(0, Number(soloCount) || 0);
    const partner = Math.max(0, Number(partnerCount) || 0);
    const total = solo + partner;

    const avgPerWeek =
      periodType === "weekly" ? total : periodType === "monthly" ? total / 4 : null;
    const avgPerMonth =
      periodType === "monthly" ? total : periodType === "weekly" ? total * 4 : null;

    const payload = {
      user_id: user.id,
      tracking_period_start: periodStart,
      tracking_period_end: periodEnd,
      period_type: periodType,
      solo_activity_count: solo,
      partner_activity_count: partner,
      total_activity_count: total,
      average_per_week: avgPerWeek,
      average_per_month: avgPerMonth,
    };

    const { data: row, error } = await db("nsfw_frequency_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackFrequency failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWFrequencyTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackFrequency error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getFrequencyTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWFrequencyTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(365);
    const to = endDate ?? todayIso();

    const { data, error } = await db("nsfw_frequency_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("tracking_period_start", from)
      .lte("tracking_period_end", to)
      .order("tracking_period_start", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getFrequencyTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWFrequencyTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getFrequencyTracking error", { error });
    return [];
  }
}
