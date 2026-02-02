import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ExpertRating } from "@/lib/expertContentConsultations/types";
import { requireUserId } from "@/lib/expertContentConsultations/utils";

function mapRating(row: any): ExpertRating {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    user_id: String(row.user_id),
    consultation_id: row.consultation_id ?? null,
    rating: Number(row.overall_rating ?? 0),
    review_title: row.review_title ?? null,
    review_text: row.review_text ?? null,
    is_approved: Boolean(row.is_verified ?? false),
    helpful_count: Number(row.helpful_count ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function rateExpert(
  expertId: string,
  rating: { overallRating: number; reviewTitle?: string; reviewText?: string },
  consultationId?: string,
): Promise<ExpertRating | null> {
  try {
    const userId = await requireUserId();
    const overall = Math.max(1, Math.min(5, Number(rating.overallRating)));

    const { data, error } = await fromExtended("expert_ratings")
      .insert({
        expert_id: expertId,
        user_id: userId,
        consultation_id: consultationId ?? null,
        workshop_id: null,
        overall_rating: overall,
        review_title: rating.reviewTitle ?? null,
        review_text: rating.reviewText ?? null,
        is_anonymous: false,
        is_public: true,
        is_verified: false,
        is_featured: false,
        helpful_count: 0,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("rateExpert failed", { error: error.message });
      toast.error("Failed to submit rating");
      return null;
    }

    toast.success("Rating submitted");
    return mapRating(data);
  } catch (error) {
    logger.error("rateExpert error", { error });
    toast.error("Failed to submit rating");
    return null;
  }
}

export async function getExpertRatings(expertId: string): Promise<ExpertRating[]> {
  try {
    const { data, error } = await fromExtended("expert_ratings")
      .select("*")
      .eq("expert_id", expertId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("getExpertRatings failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapRating);
  } catch (error) {
    logger.error("getExpertRatings error", { error });
    return [];
  }
}
