import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { clamp, db, daysAgoIso, requireUser, todayIso } from "./common";
import type { NSFWLibidoTracking } from "./types";

export async function trackLibido(
  entryDate: string,
  libidoLevel: number,
  data?: Partial<NSFWLibidoTracking>,
): Promise<NSFWLibidoTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      libido_level: clamp(Number(libidoLevel), 1, 10),
      libido_direction: data?.libido_direction ?? null,
      desire_intensity: data?.desire_intensity ?? null,
      desire_frequency: data?.desire_frequency ?? null,
      contributing_factors: data?.contributing_factors ?? null,
      inhibiting_factors: data?.inhibiting_factors ?? null,
      notes: data?.notes ?? null,
    };

    const { data: row, error } = await db("nsfw_libido_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackLibido failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWLibidoTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackLibido error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getLibidoTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWLibidoTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await db("nsfw_libido_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getLibidoTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWLibidoTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getLibidoTracking error", { error });
    return [];
  }
}
