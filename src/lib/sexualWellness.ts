/**
 * Sexual Wellness Tracking System
 * Supabase-backed implementation.
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface SexualWellnessEntry {
  id?: string;
  user_id?: string;
  entry_date: string;

  // Sexual function metrics
  erectile_function_score?: number; // 0-10
  ejaculation_quality_score?: number; // 0-10
  orgasm_intensity_score?: number; // 0-10
  stamina_duration_minutes?: number;

  // Libido and desire
  libido_level?: number; // 0-10
  desire_frequency?:
    | "daily"
    | "few_times_week"
    | "weekly"
    | "few_times_month"
    | "monthly"
    | "rarely";
  morning_erections?: boolean;

  // Satisfaction and experience
  overall_satisfaction?: number; // 0-10
  partner_satisfaction?: number; // 0-10
  sexual_confidence?: number; // 0-10

  // Frequency tracking
  sexual_activity_count?: number;
  masturbation_count?: number;
  activity_type?: "intercourse" | "masturbation" | "oral" | "other" | "none";

  // Relationship health (optional)
  relationship_satisfaction?: number; // 0-10
  communication_quality?: number; // 0-10
  intimacy_level?: number; // 0-10

  // Contextual factors
  stress_level?: number; // 0-10
  sleep_quality?: number; // 0-10
  exercise_level?: "none" | "light" | "moderate" | "intense";
  alcohol_consumption?: "none" | "light" | "moderate" | "heavy";

  // Calculated
  wellness_score?: number; // 0-100

  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SexualWellnessGoal {
  id?: string;
  user_id?: string;
  goal_type:
    | "erectile_function"
    | "libido"
    | "satisfaction"
    | "frequency"
    | "stamina"
    | "confidence"
    | "communication"
    | "intimacy";
  target_value: number;
  target_date?: string;
  current_value?: number;
  progress_percentage?: number;
  is_active?: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SexualWellnessPattern {
  id?: string;
  user_id?: string;
  pattern_type: "correlation" | "trend" | "anomaly" | "improvement" | "decline";
  pattern_description: string;
  affected_metrics?: string[];
  correlation_factors?: string[];
  confidence_score?: number;
  detected_at?: string;
  acknowledged_at?: string;
  created_at?: string;
}

export interface PartnerConnection {
  id?: string;
  user_id?: string;
  partner_user_id?: string;
  partner_email?: string;
  connection_code: string;
  connection_status?: "pending" | "active" | "paused" | "disconnected";
  share_wellness_data?: boolean;
  share_goals?: boolean;
  share_insights?: boolean;
  connected_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function upsertSexualWellnessEntry(
  entry: Omit<
    SexualWellnessEntry,
    "id" | "user_id" | "created_at" | "updated_at" | "wellness_score"
  >,
): Promise<SexualWellnessEntry> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      throw new Error("Not authenticated");
    }

    const payload = {
      user_id: user.id,
      entry_date: entry.entry_date,
      erectile_function_score: entry.erectile_function_score ?? null,
      ejaculation_quality_score: entry.ejaculation_quality_score ?? null,
      orgasm_intensity_score: entry.orgasm_intensity_score ?? null,
      stamina_duration_minutes: entry.stamina_duration_minutes ?? null,
      libido_level: entry.libido_level ?? null,
      desire_frequency: entry.desire_frequency ?? null,
      morning_erections: entry.morning_erections ?? null,
      overall_satisfaction: entry.overall_satisfaction ?? null,
      partner_satisfaction: entry.partner_satisfaction ?? null,
      sexual_confidence: entry.sexual_confidence ?? null,
      sexual_activity_count: entry.sexual_activity_count ?? 0,
      masturbation_count: entry.masturbation_count ?? null,
      activity_type: entry.activity_type ?? "none",
      relationship_satisfaction: entry.relationship_satisfaction ?? null,
      communication_quality: entry.communication_quality ?? null,
      intimacy_level: entry.intimacy_level ?? null,
      stress_level: entry.stress_level ?? null,
      sleep_quality: entry.sleep_quality ?? null,
      exercise_level: entry.exercise_level ?? null,
      alcohol_consumption: entry.alcohol_consumption ?? null,
      notes: entry.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await fromExtended("sexual_wellness_entries")
      .upsert(payload, { onConflict: "user_id,entry_date" })
      .select("*")
      .single();

    if (error) throw error;
    return data as unknown as SexualWellnessEntry;
  } catch (error) {
    logger.error("Failed to upsert sexual wellness entry", { error });
    toast.error("Failed to save entry");
    throw error;
  }
}

export async function getSexualWellnessEntries(
  startDate?: string,
  endDate?: string,
): Promise<SexualWellnessEntry[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = fromExtended("sexual_wellness_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", {
        ascending: false,
      });

    if (startDate) query = query.gte("entry_date", startDate);
    if (endDate) query = query.lte("entry_date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as SexualWellnessEntry[];
  } catch (error) {
    logger.error("Failed to fetch sexual wellness entries", { error });
    return [];
  }
}

export async function getLatestSexualWellnessEntry(): Promise<SexualWellnessEntry | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("sexual_wellness_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as SexualWellnessEntry | null) ?? null;
  } catch (error) {
    logger.error("Failed to fetch latest sexual wellness entry", { error });
    return null;
  }
}

export async function deleteSexualWellnessEntry(entryId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await fromExtended("sexual_wellness_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);
    if (error) throw error;
    toast.success("Entry deleted");
  } catch (error) {
    logger.error("Failed to delete sexual wellness entry", { error });
    toast.error("Failed to delete entry");
  }
}

export async function createSexualWellnessGoal(
  goal: Omit<
    SexualWellnessGoal,
    "id" | "user_id" | "created_at" | "updated_at" | "current_value" | "progress_percentage"
  >,
): Promise<SexualWellnessGoal> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      throw new Error("Not authenticated");
    }

    const { data, error } = await fromExtended("sexual_wellness_goals")
      .insert({
        user_id: user.id,
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        target_date: goal.target_date ?? null,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    toast.success("Goal created");
    return data as unknown as SexualWellnessGoal;
  } catch (error) {
    logger.error("Failed to create sexual wellness goal", { error });
    toast.error("Failed to create goal");
    throw error;
  }
}

export async function getSexualWellnessGoals(
  activeOnly: boolean = true,
): Promise<SexualWellnessGoal[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = fromExtended("sexual_wellness_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });
    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as SexualWellnessGoal[];
  } catch (error) {
    logger.error("Failed to fetch sexual wellness goals", { error });
    return [];
  }
}

export async function updateSexualWellnessGoal(
  goalId: string,
  updates: Partial<SexualWellnessGoal>,
): Promise<SexualWellnessGoal> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      throw new Error("Not authenticated");
    }

    const { data, error } = await fromExtended("sexual_wellness_goals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", goalId)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    toast.success("Goal updated");
    return data as unknown as SexualWellnessGoal;
  } catch (error) {
    logger.error("Failed to update sexual wellness goal", { error });
    toast.error("Failed to update goal");
    throw error;
  }
}

export async function deleteSexualWellnessGoal(goalId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await fromExtended("sexual_wellness_goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", user.id);
    if (error) throw error;
    toast.success("Goal deleted");
  } catch (error) {
    logger.error("Failed to delete sexual wellness goal", { error });
    toast.error("Failed to delete goal");
  }
}

export async function getSexualWellnessPatterns(
  unacknowledgedOnly: boolean = false,
): Promise<SexualWellnessPattern[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = fromExtended("sexual_wellness_patterns")
      .select("*")
      .eq("user_id", user.id)
      .order("detected_at", {
        ascending: false,
      });
    if (unacknowledgedOnly) query = query.is("acknowledged_at", null);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as SexualWellnessPattern[];
  } catch (error) {
    logger.error("Failed to fetch sexual wellness patterns", { error });
    return [];
  }
}

export async function acknowledgeSexualWellnessPattern(patternId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await fromExtended("sexual_wellness_patterns")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", patternId)
      .eq("user_id", user.id);
    if (error) throw error;
  } catch (error) {
    logger.error("Failed to acknowledge sexual wellness pattern", { error });
    throw error;
  }
}

export async function getSexualWellnessStatistics(
  startDate?: string,
  endDate?: string,
): Promise<{
  averageWellnessScore: number;
  averageErectileFunction: number;
  averageLibido: number;
  averageSatisfaction: number;
  averageConfidence: number;
  totalActivities: number;
  trend: "improving" | "declining" | "stable";
}> {
  try {
    const entries = await getSexualWellnessEntries(startDate, endDate);
    const recent = entries.slice(0, 90);

    const avg = (arr: Array<number | null | undefined>) => {
      const v = arr.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
      if (v.length === 0) return 0;
      return v.reduce((sum, n) => sum + n, 0) / v.length;
    };

    const wellness = recent.map(e => (e.wellness_score != null ? Number(e.wellness_score) : null));
    const erectile = recent.map(e => e.erectile_function_score ?? null);
    const libido = recent.map(e => e.libido_level ?? null);
    const satisfaction = recent.map(e => e.overall_satisfaction ?? null);
    const confidence = recent.map(e => e.sexual_confidence ?? null);
    const totalActivities = recent.reduce(
      (sum, e) => sum + Number(e.sexual_activity_count || 0),
      0,
    );

    // Trend: compare most recent third vs oldest third
    const third = Math.max(1, Math.floor(wellness.length / 3));
    const recentAvg = avg(wellness.slice(0, third));
    const olderAvg = avg(wellness.slice(-third));
    const delta = recentAvg - olderAvg;
    const trend: "improving" | "declining" | "stable" =
      delta > 2 ? "improving" : delta < -2 ? "declining" : "stable";

    return {
      averageWellnessScore: avg(wellness),
      averageErectileFunction: avg(erectile),
      averageLibido: avg(libido),
      averageSatisfaction: avg(satisfaction),
      averageConfidence: avg(confidence),
      totalActivities,
      trend,
    };
  } catch (error) {
    logger.error("Failed to compute sexual wellness statistics", { error });
    return {
      averageWellnessScore: 0,
      averageErectileFunction: 0,
      averageLibido: 0,
      averageSatisfaction: 0,
      averageConfidence: 0,
      totalActivities: 0,
      trend: "stable",
    };
  }
}

export async function createPartnerConnection(partnerEmail?: string): Promise<PartnerConnection> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      throw new Error("Not authenticated");
    }

    const connection_code = `${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const { data, error } = await fromExtended("partner_connections")
      .insert({
        user_id: user.id,
        partner_email: partnerEmail ?? null,
        connection_code,
        connection_status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    toast.success("Connection created");
    return data as unknown as PartnerConnection;
  } catch (error) {
    logger.error("Failed to create partner connection", { error });
    toast.error("Failed to create connection");
    throw error;
  }
}

export async function getPartnerConnections(): Promise<PartnerConnection[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("partner_connections")
      .select("*")
      .or(`user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as PartnerConnection[];
  } catch (error) {
    logger.error("Failed to fetch partner connections", { error });
    return [];
  }
}
