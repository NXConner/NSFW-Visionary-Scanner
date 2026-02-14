import { toast } from "sonner";

import { logger } from "@/lib/logger";

import type { JsonObject, RoutineTemplate } from "../types";
import type { AdaptiveRoutine } from "../advancedTypes";
import { clamp, db, requireUserId } from "./common";

function mapAdaptive(r: any): AdaptiveRoutine {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    base_template_id: r.base_template_id ?? null,
    routine_name: String(r.routine_name ?? ""),
    adaptation_reason: r.adaptation_reason ?? null,
    user_profile: (r.user_profile ?? null) as JsonObject | null,
    adaptation_history: (r.adaptation_history ?? null) as JsonObject | null,
    current_exercises: (r.current_exercises ?? null) as JsonObject | null,
    current_schedule: (r.current_schedule ?? null) as JsonObject | null,
    difficulty_adjustment: Number(r.difficulty_adjustment ?? 1),
    ai_model_version: r.ai_model_version ?? null,
    adaptation_confidence: r.adaptation_confidence != null ? Number(r.adaptation_confidence) : null,
    last_adapted_at: r.last_adapted_at ?? null,
    adaptation_count: Number(r.adaptation_count ?? 0),
    status: (r.status as AdaptiveRoutine["status"]) ?? "active",
    start_date: r.start_date ?? null,
    target_end_date: r.target_end_date ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function getAdaptiveRoutines(): Promise<AdaptiveRoutine[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("adaptive_routines")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      logger.error("getAdaptiveRoutines failed", { error: error.message });
      return [];
    }
    return (data || []).map(mapAdaptive);
  } catch (error) {
    logger.error("getAdaptiveRoutines error", { error });
    return [];
  }
}

export async function createAdaptiveRoutine(
  baseTemplateId: string | null,
  routineName: string,
): Promise<AdaptiveRoutine | null> {
  try {
    const userId = await requireUserId();

    let template: RoutineTemplate | null = null;
    if (baseTemplateId) {
      const { data, error } = await db
        .from("routine_templates")
        .select("*")
        .eq("id", baseTemplateId)
        .maybeSingle();
      if (!error && data) template = data as RoutineTemplate;
    }

    const now = new Date();
    const schedule: JsonObject = {
      sessions_per_week: template?.sessions_per_week ?? null,
      estimated_time_per_session_minutes: template?.estimated_time_per_session_minutes ?? null,
      intensity_level: template?.intensity_level ?? null,
    };

    const userProfile: JsonObject = {
      target_goals: template?.target_goals ?? null,
      created_from_template: template?.id ?? null,
    };

    const currentExercises: JsonObject = {
      exercises: (template?.exercises ?? []) as unknown,
    };

    const { data, error } = await db
      .from("adaptive_routines")
      .insert({
        user_id: userId,
        base_template_id: baseTemplateId,
        routine_name: routineName,
        adaptation_reason: template ? "Created from template" : "Custom routine",
        user_profile: userProfile,
        adaptation_history: [],
        current_exercises: currentExercises,
        current_schedule: schedule,
        difficulty_adjustment: 1,
        ai_model_version: null,
        adaptation_confidence: null,
        last_adapted_at: null,
        adaptation_count: 0,
        status: "active",
        start_date: now.toISOString().slice(0, 10),
        target_end_date: null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("createAdaptiveRoutine failed", { error: error.message });
      toast.error("Failed to create adaptive routine");
      return null;
    }

    toast.success("Adaptive routine created");
    return mapAdaptive(data);
  } catch (error) {
    logger.error("createAdaptiveRoutine error", { error });
    toast.error("Failed to create adaptive routine");
    return null;
  }
}

export async function adaptRoutine(routineId: string): Promise<boolean> {
  try {
    const userId = await requireUserId();

    const { data: routine, error: rErr } = await db
      .from("adaptive_routines")
      .select("*")
      .eq("id", routineId)
      .eq("user_id", userId)
      .maybeSingle();

    if (rErr || !routine) {
      toast.error("Routine not found");
      return false;
    }

    const { data: analytics } = await db
      .from("routine_analytics")
      .select(
        "completion_rate, average_session_duration_minutes, total_sessions, completed_sessions, calculated_at",
      )
      .eq("routine_id", routineId)
      .eq("user_id", userId)
      .order("calculated_at", { ascending: false })
      .limit(1);

    const last = Array.isArray(analytics) ? analytics[0] : null;
    const completionRate = last?.completion_rate != null ? Number(last.completion_rate) : null;

    const prevAdj = Number(routine.difficulty_adjustment ?? 1);
    let nextAdj = prevAdj;
    let reason = "Manual adaptation";

    if (completionRate != null) {
      if (completionRate >= 80) {
        nextAdj = prevAdj + 0.05;
        reason = "High completion rate";
      } else if (completionRate <= 50) {
        nextAdj = prevAdj - 0.05;
        reason = "Low completion rate";
      } else {
        reason = "Stable completion rate";
      }
    }

    nextAdj = clamp(nextAdj, 0.5, 2.0);

    const history = Array.isArray(routine.adaptation_history) ? routine.adaptation_history : [];
    const historyEntry: JsonObject = {
      at: new Date().toISOString(),
      from: prevAdj,
      to: nextAdj,
      reason,
      analytics_snapshot: last ?? null,
    };

    const updatedHistory = [...history, historyEntry];

    const { error } = await db
      .from("adaptive_routines")
      .update({
        difficulty_adjustment: nextAdj,
        adaptation_reason: reason,
        adaptation_history: updatedHistory,
        adaptation_count: Number(routine.adaptation_count ?? 0) + 1,
        last_adapted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", routineId)
      .eq("user_id", userId);

    if (error) {
      logger.error("adaptRoutine failed", { error: error.message, routineId });
      toast.error("Failed to adapt routine");
      return false;
    }

    toast.success("Routine adapted");
    return true;
  } catch (error) {
    logger.error("adaptRoutine error", { error, routineId });
    toast.error("Failed to adapt routine");
    return false;
  }
}
