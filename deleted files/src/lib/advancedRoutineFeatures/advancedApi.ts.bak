import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { JsonObject, RoutineTemplate } from "./types";

const db = { from: (t: string) => fromExtended(t as any) };
import type {
  AdaptiveRoutine,
  MultiWeekProgram,
  RestDayRecommendation,
  RoutineAnalytics,
  RoutineMarketplaceItem,
  SharedRoutine,
  VideoGuidedRoutine,
} from "./advancedTypes";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num));
}

function toIsoOrNull(v: any): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

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

export async function getMarketplaceRoutines(
  category?: string,
  maxPrice?: number,
): Promise<RoutineMarketplaceItem[]> {
  try {
    let q = (db as any)
      .from("routine_marketplace")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (category) q = q.eq("marketplace_category", category);
    if (maxPrice != null && Number.isFinite(maxPrice)) q = q.lte("price", Number(maxPrice));

    const { data, error } = await q;
    if (error) {
      logger.error("getMarketplaceRoutines failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      template_id: r.template_id ?? null,
      creator_id: String(r.creator_id),
      price: Number(r.price ?? 0),
      currency: String(r.currency ?? "USD"),
      is_subscription: Boolean(r.is_subscription),
      subscription_duration_days: r.subscription_duration_days ?? null,
      marketplace_category: r.marketplace_category ?? null,
      tags: Array.isArray(r.tags) ? r.tags.map(String) : null,
      featured_image_url: r.featured_image_url ?? null,
      preview_video_url: r.preview_video_url ?? null,
      sales_count: Number(r.sales_count ?? 0),
      revenue_total: Number(r.revenue_total ?? 0),
      average_rating: r.average_rating != null ? Number(r.average_rating) : null,
      is_active: Boolean(r.is_active),
      is_featured: Boolean(r.is_featured),
      created_at: String(r.created_at ?? new Date().toISOString()),
      updated_at: String(r.updated_at ?? new Date().toISOString()),
    })) as RoutineMarketplaceItem[];
  } catch (error) {
    logger.error("getMarketplaceRoutines error", { error });
    return [];
  }
}

export async function purchaseRoutine(marketplaceId: string): Promise<boolean> {
  try {
    const origin = window.location.origin;
    const successUrl = `${origin}/routines?purchase=success&marketplace=${encodeURIComponent(marketplaceId)}`;
    const cancelUrl = `${origin}/routines?purchase=cancel&marketplace=${encodeURIComponent(marketplaceId)}`;

    const { data, error } = await supabase.functions.invoke(
      "create-routine-marketplace-checkout-session",
      {
        body: { marketplaceId, successUrl, cancelUrl },
      },
    );

    if (error || !data?.url) {
      const msg = error?.message || data?.error || "Checkout not available";
      toast.error(msg);
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (error) {
    logger.error("purchaseRoutine error", { error, marketplaceId });
    toast.error("Failed to start checkout");
    return false;
  }
}

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

function mapProgram(r: any): MultiWeekProgram {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    base_template_id: r.base_template_id ?? null,
    program_name: String(r.program_name ?? ""),
    description: r.description ?? null,
    total_weeks: Number(r.total_weeks ?? 0),
    current_week: Number(r.current_week ?? 1),
    weekly_schedules: (r.phases ?? null) as JsonObject | null,
    progress_milestones: (r.milestones ?? null) as JsonObject | null,
    status: (r.status as MultiWeekProgram["status"]) ?? "active",
    start_date: r.start_date ?? null,
    target_end_date: r.target_end_date ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function getMultiWeekPrograms(): Promise<MultiWeekProgram[]> {
  try {
    const userId = await requireUserId();

    const { data, error } = await db
      .from("multi_week_programs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("getMultiWeekPrograms failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapProgram);
  } catch (error) {
    logger.error("getMultiWeekPrograms error", { error });
    return [];
  }
}

export async function createMultiWeekProgram(
  programName: string,
  totalWeeks: number,
  baseTemplateId?: string,
): Promise<MultiWeekProgram | null> {
  try {
    const userId = await requireUserId();

    let template: RoutineTemplate | null = null;
    if (baseTemplateId) {
      const { data } = await db
        .from("routine_templates")
        .select("*")
        .eq("id", baseTemplateId)
        .maybeSingle();
      if (data) template = data as RoutineTemplate;
    }

    // Program phases must exist; if no template, require user-defined phases externally.
    if (!template) {
      toast.error("Select a template to create a program");
      return null;
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const phases = [
      {
        phase_number: 1,
        phase_name: "Base phase",
        description: "Generated from selected template",
        duration_weeks: totalWeeks,
        start_week: 1,
        end_week: totalWeeks,
        phase_routine: {
          template_id: template.id,
          template_name: template.template_name,
          exercises: template.exercises,
          sessions_per_week: template.sessions_per_week ?? null,
        },
      },
    ] as unknown as JsonObject;

    const { data, error } = await db
      .from("multi_week_programs")
      .insert({
        user_id: userId,
        base_template_id: baseTemplateId ?? null,
        program_name: programName,
        description: template.description ?? null,
        total_weeks: Math.max(1, Math.min(52, Number(totalWeeks))),
        current_week: 1,
        phases,
        start_date: startDate,
        target_end_date: null,
        actual_end_date: null,
        completion_percentage: 0,
        weeks_completed: 0,
        status: "active",
        program_goals: template.target_goals ?? null,
        milestones: null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("createMultiWeekProgram failed", { error: error.message });
      toast.error("Failed to create program");
      return null;
    }

    toast.success("Program created");
    return mapProgram(data);
  } catch (error) {
    logger.error("createMultiWeekProgram error", { error });
    toast.error("Failed to create program");
    return null;
  }
}

export async function getVideoGuidedRoutines(): Promise<VideoGuidedRoutine[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("video_guided_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("getVideoGuidedRoutines failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      routine_id: r.routine_id ?? null,
      video_url: String(r.video_url ?? ""),
      thumbnail_url: r.video_thumbnail_url ?? null,
      duration_seconds: r.video_duration_seconds ?? null,
      instructor_name: null,
      difficulty_level: null,
      is_premium: false,
      view_count: 0,
      created_at: String(r.created_at ?? new Date().toISOString()),
    })) as VideoGuidedRoutine[];
  } catch (error) {
    logger.error("getVideoGuidedRoutines error", { error });
    return [];
  }
}

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
