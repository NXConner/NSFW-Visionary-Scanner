import { toast } from "sonner";

import { logger } from "@/lib/logger";

import type { JsonObject } from "../types";
import type { SharedRoutine } from "../advancedTypes";
import { db, requireUserId } from "./common";

export async function shareRoutine(
  routineId: string,
  shareName: string,
  description?: string,
  isPublic: boolean = false,
): Promise<SharedRoutine | null> {
  try {
    const userId = await requireUserId();

    // Try adaptive routine first; fallback to template.
    const { data: adaptive } = await db
      .from("adaptive_routines")
      .select("*")
      .eq("id", routineId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: template } = adaptive
      ? { data: null }
      : await db.from("routine_templates").select("*").eq("id", routineId).maybeSingle();

    const routineData: JsonObject = {
      source: adaptive ? "adaptive_routines" : "routine_templates",
      snapshot_at: new Date().toISOString(),
      routine: adaptive ?? template ?? null,
    };

    const token = crypto.randomUUID();

    const { data, error } = await db
      .from("shared_routines")
      .insert({
        routine_id: routineId,
        user_id: userId,
        share_name: shareName,
        description: description ?? null,
        is_public: Boolean(isPublic),
        share_token: token,
        shared_with_users: null,
        routine_data: routineData,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("shareRoutine failed", { error: error.message });
      toast.error("Failed to share routine");
      return null;
    }

    return {
      id: String(data.id),
      routine_id: data.routine_id ?? null,
      user_id: String(data.user_id),
      share_name: String(data.share_name),
      description: data.description ?? null,
      is_public: Boolean(data.is_public),
      share_token: data.share_token ?? null,
      shared_with_users: data.shared_with_users ? data.shared_with_users.map(String) : null,
      routine_data: (data.routine_data ?? null) as JsonObject | null,
      view_count: Number(data.view_count ?? 0),
      copy_count: Number(data.copy_count ?? 0),
      rating_average: data.rating_average != null ? Number(data.rating_average) : null,
      rating_count: Number(data.rating_count ?? 0),
      created_at: String(data.created_at ?? new Date().toISOString()),
      updated_at: String(data.updated_at ?? new Date().toISOString()),
    } as SharedRoutine;
  } catch (error) {
    logger.error("shareRoutine error", { error });
    toast.error("Failed to share routine");
    return null;
  }
}
