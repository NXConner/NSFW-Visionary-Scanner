import { logger } from "@/lib/logger";

import type { RoutineAnalytics } from "../advancedTypes";
import { db, requireUserId, toIsoOrNull } from "./common";

export async function getRoutineAnalytics(routineId: string): Promise<RoutineAnalytics | null> {
  try {
    const userId = await requireUserId();

    const { data, error } = await db
      .from("routine_analytics")
      .select("*")
      .eq("routine_id", routineId)
      .eq("user_id", userId)
      .order("calculated_at", { ascending: false })
      .limit(1);

    if (error) {
      logger.error("getRoutineAnalytics failed", { error: error.message });
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return null;

    return {
      routine_id: routineId,
      total_sessions: Number(row.total_sessions ?? 0),
      completed_sessions: Number(row.completed_sessions ?? 0),
      completion_rate: Number(row.completion_rate ?? 0),
      average_session_duration: Number(row.average_session_duration_minutes ?? 0),
      total_time_spent: Number(row.total_time_spent_minutes ?? 0),
      streak_current: 0,
      streak_longest: 0,
      last_session_at: toIsoOrNull(row.calculated_at),
    } as RoutineAnalytics;
  } catch (error) {
    logger.error("getRoutineAnalytics error", { error, routineId });
    return null;
  }
}
