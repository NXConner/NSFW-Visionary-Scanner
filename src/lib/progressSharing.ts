/**
 * Progress Sharing & Challenges System (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000011_progress_sharing_challenges.sql
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

const db = { from: (t: string) => fromExtended(t as any) };

export interface ProgressShare {
  id?: string;
  user_id?: string;
  share_type: "scan" | "wellness" | "routine" | "achievement" | "milestone" | "general";
  content_type: "text" | "image" | "chart" | "metric";
  title?: string;
  description?: string;
  content_data?: any;
  is_anonymous?: boolean;
  display_name?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  share_count?: number;
  is_approved?: boolean;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Challenge {
  id?: string;
  name: string;
  description: string;
  challenge_type: "30_day" | "60_day" | "90_day" | "custom" | "community" | "premium";
  duration_days: number;
  goal_description?: string;
  target_metrics?: any;
  success_criteria?: any;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_recurring?: boolean;
  participant_count?: number;
  completion_count?: number;
  is_featured?: boolean;
  is_premium?: boolean;
  reward_description?: string;
  badge_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChallengeParticipant {
  id?: string;
  challenge_id: string;
  user_id?: string;
  status?: "active" | "completed" | "abandoned" | "paused";
  progress_percentage?: number;
  current_metrics?: any;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
}

export interface ChallengeCheckin {
  id?: string;
  participant_id: string;
  checkin_date: string;
  metrics?: any;
  notes?: string;
  photo_url?: string;
  created_at?: string;
}

export interface Leaderboard {
  id?: string;
  name: string;
  description?: string;
  leaderboard_type: "challenge" | "overall" | "monthly" | "all_time" | "category";
  metric_type:
    | "wellness_score"
    | "streak"
    | "achievements"
    | "challenge_completion"
    | "reputation"
    | "custom";
  period_start?: string;
  period_end?: string;
  is_active?: boolean;
  is_anonymous?: boolean;
  requires_opt_in?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaderboardEntry {
  id?: string;
  leaderboard_id: string;
  user_id?: string;
  rank?: number;
  score?: number;
  display_name?: string;
  is_anonymous?: boolean;
  metrics?: any;
  updated_at?: string;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function shareProgress(share: Partial<ProgressShare>): Promise<ProgressShare | null> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("progress_shares")
      .insert({
        user_id: userId,
        share_type: share.share_type ?? "general",
        content_type: share.content_type ?? "text",
        title: share.title ?? null,
        description: share.description ?? null,
        content_data: share.content_data ?? null,
        is_anonymous: Boolean(share.is_anonymous ?? true),
        display_name: share.display_name ?? null,
        is_featured: false,
        is_approved: true,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("shareProgress failed", { error: error.message });
      return null;
    }

    return (data ?? null) as ProgressShare | null;
  } catch (error) {
    logger.error("shareProgress error", { error });
    return null;
  }
}

export async function getProgressShares(
  shareType?: string,
  limit: number = 20,
): Promise<ProgressShare[]> {
  try {
    let q = db
      .from("progress_shares")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, limit - 1));
    if (shareType) q = q.eq("share_type", shareType);
    const { data, error } = await q;
    if (error) {
      logger.error("getProgressShares failed", { error: error.message });
      return [];
    }
    return (data ?? []) as ProgressShare[];
  } catch (error) {
    logger.error("getProgressShares error", { error });
    return [];
  }
}

export async function interactWithProgressShare(
  shareId: string,
  interactionType: "like" | "comment" | "share",
  commentText?: string,
): Promise<void> {
  const userId = await requireUserId();
  const now = new Date().toISOString();

  // Insert interaction (unique constraint prevents duplicates for like/share)
  try {
    const { data: inserted, error } = await db
      .from("progress_share_interactions")
      .insert({
        user_id: userId,
        share_id: shareId,
        interaction_type: interactionType,
        comment_text: interactionType === "comment" ? (commentText ?? null) : null,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Duplicate like/share => ignore
      return;
    }

    if (!inserted?.id) return;

    // Best-effort counters
    const col =
      interactionType === "like"
        ? "like_count"
        : interactionType === "comment"
          ? "comment_count"
          : "share_count";

    try {
      const { data: row } = await db
        .from("progress_shares")
        .select(col)
        .eq("id", shareId)
        .maybeSingle();
      const current = row && row[col] != null ? Number(row[col]) : 0;
      await db
        .from("progress_shares")
        .update({ [col]: current + 1, updated_at: now })
        .eq("id", shareId);
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  try {
    const { data, error } = await db
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("start_date", { ascending: true })
      .limit(100);
    if (error) return [];
    return (data ?? []) as Challenge[];
  } catch {
    return [];
  }
}

export async function joinChallenge(challengeId: string): Promise<ChallengeParticipant | null> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("challenge_participants")
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        status: "active",
        progress_percentage: 0,
        current_metrics: null,
      })
      .select("*")
      .single();
    if (error) return null;
    return (data ?? null) as ChallengeParticipant | null;
  } catch (error) {
    logger.error("joinChallenge error", { error });
    return null;
  }
}

export async function getUserChallenges(): Promise<ChallengeParticipant[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("challenge_participants")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(200);
    if (error) return [];
    return (data ?? []) as ChallengeParticipant[];
  } catch {
    return [];
  }
}

export async function submitChallengeCheckin(
  participantId: string,
  checkin: Partial<ChallengeCheckin>,
): Promise<ChallengeCheckin | null> {
  try {
    await requireUserId();
    const date = checkin.checkin_date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await db
      .from("challenge_checkins")
      .upsert(
        {
          participant_id: participantId,
          checkin_date: date,
          metrics: checkin.metrics ?? null,
          notes: checkin.notes ?? null,
          photo_url: checkin.photo_url ?? null,
        },
        { onConflict: "participant_id,checkin_date" },
      )
      .select("*")
      .single();
    if (error) return null;
    return (data ?? null) as ChallengeCheckin | null;
  } catch {
    return null;
  }
}

export async function getLeaderboards(leaderboardType?: string): Promise<Leaderboard[]> {
  try {
    // Use secure RPC function that excludes user_id to prevent activity tracking
    const { data, error } = await supabase.rpc("get_public_leaderboards", {
      p_leaderboard_type: leaderboardType ?? null,
      p_period: null,
      p_limit: 100,
    });
    if (error) return [];
    // Map RPC results to Leaderboard type (without user_id for privacy)
    // Note: The leaderboards table stores entries, not definitions - adding required fields
    return (data ?? []).map((entry: any) => ({
      id: entry.id,
      name: entry.display_name || `${entry.leaderboard_type} Leaderboard`,
      leaderboard_type: entry.leaderboard_type as Leaderboard["leaderboard_type"],
      metric_type: "custom" as const,
      period_start: entry.period,
      is_active: true,
      is_anonymous: entry.is_anonymous,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    })) as unknown as Leaderboard[];
  } catch {
    return [];
  }
}

export async function getLeaderboardEntries(
  leaderboardId: string,
  limit: number = 100,
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await db
      .from("leaderboard_entries")
      .select("*")
      .eq("leaderboard_id", leaderboardId)
      .order("rank", { ascending: true })
      .range(0, Math.max(0, limit - 1));
    if (error) return [];
    return (data ?? []) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export async function optIntoLeaderboard(leaderboardId: string): Promise<void> {
  try {
    const userId = await requireUserId();
    // Store opt-in as a bookmark interaction to avoid new schema.
    await db.from("leaderboard_entries").upsert(
      {
        leaderboard_id: leaderboardId,
        user_id: userId,
        is_anonymous: true,
        display_name: "Anonymous",
        score: 0,
        rank: null,
        metrics: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "leaderboard_id,user_id" },
    );
    toast.success("Opted in");
  } catch {
    // ignore
  }
}
