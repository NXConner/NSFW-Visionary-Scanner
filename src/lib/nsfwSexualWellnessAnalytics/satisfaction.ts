import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { clamp, db, daysAgoIso, requireUser, todayIso } from "./common";
import type { NSFWSatisfactionTracking } from "./types";

export async function trackSatisfaction(
  entryDate: string,
  overallSatisfaction: number,
  data?: Partial<NSFWSatisfactionTracking>,
): Promise<NSFWSatisfactionTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      overall_satisfaction: clamp(Number(overallSatisfaction), 1, 10),
      physical_satisfaction: data?.physical_satisfaction ?? null,
      emotional_satisfaction: data?.emotional_satisfaction ?? null,
      partner_satisfaction: data?.partner_satisfaction ?? null,
      mutual_satisfaction: data?.mutual_satisfaction ?? null,
      satisfaction_factors: data?.satisfaction_factors ?? null,
      dissatisfaction_factors: data?.dissatisfaction_factors ?? null,
      activity_type: data?.activity_type ?? null,
      // DB schema treats this as boolean (unknown -> false)
      partner_present: Boolean(data?.partner_present),
      notes: data?.notes ?? null,
    };

    const { data: row, error } = await db("nsfw_satisfaction_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackSatisfaction failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWSatisfactionTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackSatisfaction error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getSatisfactionTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWSatisfactionTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await db("nsfw_satisfaction_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getSatisfactionTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWSatisfactionTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getSatisfactionTracking error", { error });
    return [];
  }
}
