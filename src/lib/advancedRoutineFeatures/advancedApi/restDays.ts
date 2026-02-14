import { logger } from "@/lib/logger";

import type { JsonObject } from "../types";
import type { RestDayRecommendation } from "../advancedTypes";
import { db, requireUserId } from "./common";

export async function getRestDayRecommendations(
  routineId?: string,
): Promise<RestDayRecommendation[]> {
  try {
    const userId = await requireUserId();

    let q = (db as any)
      .from("rest_day_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("recommended_date", { ascending: false })
      .limit(60);

    if (routineId) q = q.eq("routine_id", routineId);

    const { data, error } = await q;
    if (error) {
      logger.error("getRestDayRecommendations failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      routine_id: r.routine_id ?? null,
      recommended_date: String(r.recommended_date),
      recommendation_type:
        (r.recommendation_type as RestDayRecommendation["recommendation_type"]) ?? null,
      reason: String(r.reason ?? ""),
      factors_considered: (r.factors_considered ?? null) as JsonObject | null,
      confidence: r.confidence != null ? Number(r.confidence) : null,
      was_followed: r.was_followed ?? null,
      user_feedback: r.user_feedback ?? null,
      recommended_at: String(r.recommended_at ?? new Date().toISOString()),
      created_at: String(r.created_at ?? new Date().toISOString()),
    })) as RestDayRecommendation[];
  } catch (error) {
    logger.error("getRestDayRecommendations error", { error });
    return [];
  }
}
