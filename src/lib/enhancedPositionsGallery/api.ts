import { supabase } from "@/integrations/supabase/client";

import type {
  PositionComparison,
  PositionDifficultyRating,
  PositionEffectivenessTracking,
  PositionPlaylist,
  PositionRecommendation,
  PositionReview,
} from "./types";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function nowIso() {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeDate(d?: string) {
  if (!d) return null;
  return d.length >= 10 ? d.slice(0, 10) : d;
}

export async function submitDifficultyRating(
  positionId: string,
  difficultyRating: number,
  physicalDifficulty?: number,
  coordinationDifficulty?: number,
  notes?: string,
): Promise<PositionDifficultyRating | null> {
  const userId = await requireUserId();
  const payload = {
    position_id: positionId,
    user_id: userId,
    difficulty_rating: clamp(difficultyRating, 1, 10),
    physical_difficulty: physicalDifficulty != null ? clamp(physicalDifficulty, 1, 10) : null,
    coordination_difficulty:
      coordinationDifficulty != null ? clamp(coordinationDifficulty, 1, 10) : null,
    notes: notes ?? null,
    updated_at: nowIso(),
  };

  const { data, error } = await supabase

    .from("position_difficulty_ratings" as any)
    .upsert(payload, { onConflict: "position_id,user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as PositionDifficultyRating | null;
}

export async function getPositionDifficultyRatings(
  positionId: string,
): Promise<PositionDifficultyRating[]> {
  const { data, error } = await supabase

    .from("position_difficulty_ratings" as any)
    .select("*")
    .eq("position_id", positionId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as PositionDifficultyRating[];
}

export async function trackPositionEffectiveness(
  positionId: string,
  effectivenessRating: number,
  pleasureRating?: number,
  intensityRating?: number,
  comfortRating?: number,
  sessionDate?: string,
  notes?: string,
): Promise<PositionEffectivenessTracking | null> {
  const userId = await requireUserId();
  const payload = {
    position_id: positionId,
    user_id: userId,
    effectiveness_rating: clamp(effectivenessRating, 1, 10),
    pleasure_rating: pleasureRating != null ? clamp(pleasureRating, 1, 10) : null,
    intensity_rating: intensityRating != null ? clamp(intensityRating, 1, 10) : null,
    comfort_rating: comfortRating != null ? clamp(comfortRating, 1, 10) : null,
    session_date: normalizeDate(sessionDate),
    notes: notes ?? null,
  };

  const { data, error } = await supabase

    .from("position_effectiveness_tracking" as any)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as PositionEffectivenessTracking | null;
}

export async function createPositionReview(
  positionId: string,
  rating: number,
  reviewText?: string,
  tips?: string[],
  pros?: string[],
  cons?: string[],
): Promise<PositionReview | null> {
  const userId = await requireUserId();
  const payload = {
    position_id: positionId,
    user_id: userId,
    rating: clamp(rating, 1, 5),
    review_text: reviewText ?? null,
    tips: tips ?? null,
    pros: pros ?? null,
    cons: cons ?? null,
    times_tried: 1,
    would_recommend: null,
    is_approved: false,
    is_featured: false,
    helpful_count: 0,
    updated_at: nowIso(),
  };

  const { data, error } = await supabase

    .from("position_reviews" as any)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as PositionReview | null;
}

export async function getPositionReviews(positionId: string): Promise<PositionReview[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase

    .from("position_reviews" as any)
    .select("*")
    .eq("position_id", positionId)
    .or(`is_approved.eq.true,user_id.eq.${userId}`)
    .order("is_featured", { ascending: false })
    .order("helpful_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as PositionReview[];
}

export async function createPositionPlaylist(
  playlistName: string,
  positionIds: string[],
  description?: string,
  isPublic: boolean = false,
): Promise<PositionPlaylist | null> {
  const userId = await requireUserId();
  const uniqueIds = Array.from(new Set(positionIds)).filter(Boolean);
  const payload = {
    user_id: userId,
    playlist_name: playlistName,
    description: description ?? null,
    is_public: isPublic,
    is_featured: false,
    position_ids: uniqueIds,
    position_count: uniqueIds.length,
    view_count: 0,
    copy_count: 0,
    like_count: 0,
    updated_at: nowIso(),
  };

  const { data, error } = await supabase

    .from("position_playlists" as any)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as PositionPlaylist | null;
}

export async function getPositionPlaylists(
  includePublic: boolean = true,
): Promise<PositionPlaylist[]> {
  const userId = await requireUserId();

  let q = supabase
    .from("position_playlists" as any)
    .select("*")
    .order("updated_at", { ascending: false });
  q = includePublic ? q.or(`is_public.eq.true,user_id.eq.${userId}`) : q.eq("user_id", userId);
  const { data, error } = await q.limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as PositionPlaylist[];
}

export async function getPositionRecommendations(
  recommendationType?: PositionRecommendation["recommendation_type"],
): Promise<PositionRecommendation[]> {
  const userId = await requireUserId();

  let q = supabase
    .from("position_recommendations" as any)
    .select("*")
    .eq("user_id", userId)
    .order("recommended_at", { ascending: false });
  if (recommendationType) q = q.eq("recommendation_type", recommendationType);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as PositionRecommendation[];
}

export async function createPositionComparison(
  positionIds: string[],
  comparisonName?: string,
): Promise<PositionComparison | null> {
  const userId = await requireUserId();
  const uniqueIds = Array.from(new Set(positionIds)).filter(Boolean);
  if (uniqueIds.length < 2) throw new Error("Select at least 2 positions to compare");

  // Aggregate difficulty + effectiveness across all users (allowed by RLS for select).
  const [difficulty, effectiveness] = await Promise.all([
    supabase

      .from("position_difficulty_ratings" as any)
      .select("position_id, difficulty_rating, physical_difficulty, coordination_difficulty")
      .in("position_id", uniqueIds),
    supabase

      .from("position_effectiveness_tracking" as any)
      .select(
        "position_id, effectiveness_rating, pleasure_rating, intensity_rating, comfort_rating",
      )
      .in("position_id", uniqueIds),
  ]);

  if (difficulty.error) throw difficulty.error;
  if (effectiveness.error) throw effectiveness.error;

  const byPos = new Map<string, any>();
  for (const id of uniqueIds) byPos.set(id, { position_id: id });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : null);

  for (const id of uniqueIds) {
    const dRows = (difficulty.data ?? []).filter((r: any) => r.position_id === id);

    const eRows = (effectiveness.data ?? []).filter((r: any) => r.position_id === id);
    byPos.set(id, {
      position_id: id,

      difficulty_avg: avg(
        dRows.map((r: any) => Number(r.difficulty_rating)).filter(n => Number.isFinite(n)),
      ),

      physical_avg: avg(
        dRows.map((r: any) => Number(r.physical_difficulty)).filter(n => Number.isFinite(n)),
      ),

      coordination_avg: avg(
        dRows.map((r: any) => Number(r.coordination_difficulty)).filter(n => Number.isFinite(n)),
      ),

      effectiveness_avg: avg(
        eRows.map((r: any) => Number(r.effectiveness_rating)).filter(n => Number.isFinite(n)),
      ),

      pleasure_avg: avg(
        eRows.map((r: any) => Number(r.pleasure_rating)).filter(n => Number.isFinite(n)),
      ),

      comfort_avg: avg(
        eRows.map((r: any) => Number(r.comfort_rating)).filter(n => Number.isFinite(n)),
      ),
    });
  }

  const rows = uniqueIds.map(id => byPos.get(id));
  const sortedByEffect = [...rows].sort(
    (a, b) => Number(b.effectiveness_avg ?? -1) - Number(a.effectiveness_avg ?? -1),
  );
  const insights: string[] = [];
  if (sortedByEffect[0]?.effectiveness_avg != null) {
    insights.push(`Top overall effectiveness: ${sortedByEffect[0].position_id}`);
  }
  const sortedByComfort = [...rows].sort(
    (a, b) => Number(b.comfort_avg ?? -1) - Number(a.comfort_avg ?? -1),
  );
  if (sortedByComfort[0]?.comfort_avg != null) {
    insights.push(`Most comfortable: ${sortedByComfort[0].position_id}`);
  }
  const sortedByDiff = [...rows].sort(
    (a, b) => Number(a.difficulty_avg ?? 999) - Number(b.difficulty_avg ?? 999),
  );
  if (sortedByDiff[0]?.difficulty_avg != null) {
    insights.push(`Easiest (community-rated): ${sortedByDiff[0].position_id}`);
  }

  const comparison_results = { positions: rows };

  const { data, error } = await supabase

    .from("position_comparisons" as any)
    .insert({
      user_id: userId,
      position_ids: uniqueIds,
      comparison_name: comparisonName ?? null,
      comparison_results,
      insights,
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as PositionComparison | null;
}
