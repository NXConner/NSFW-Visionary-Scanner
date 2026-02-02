import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

export type LearningCourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCourseReviews(courseId: string): Promise<LearningCourseReview[]> {
  try {
    const { data, error } = await fromExtended("learning_course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      logger.error("getCourseReviews failed", { error: error.message });
      return [];
    }
    return (data ?? []) as LearningCourseReview[];
  } catch (error) {
    logger.error("getCourseReviews error", { error });
    return [];
  }
}

export async function submitCourseReview(
  courseId: string,
  rating: number,
  review?: string,
): Promise<LearningCourseReview | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in to review");
      return null;
    }

    const r = Math.max(1, Math.min(5, Number(rating)));
    const { data, error } = await fromExtended("learning_course_reviews")
      .upsert(
        {
          course_id: courseId,
          user_id: auth.user.id,
          rating: r,
          review_text: review ?? null,
        },
        { onConflict: "course_id,user_id" },
      )
      .select("*")
      .single();

    if (error) {
      logger.error("submitCourseReview failed", { error: error.message });
      toast.error("Failed to submit review");
      return null;
    }

    // Best-effort update course aggregate
    try {
      const { data: agg } = await fromExtended("learning_course_reviews")
        .select("rating", { count: "exact" })
        .eq("course_id", courseId);
      const count = (agg as any)?.length ?? 0;
      const avg =
        count > 0
          ? (agg as any).reduce((sum: number, row: any) => sum + Number(row.rating ?? 0), 0) / count
          : 0;
      await fromExtended("learning_courses")
        .update({
          average_rating: Number(avg.toFixed(2)),
          rating_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);
    } catch {
      // ignore
    }

    toast.success("Review submitted");
    return (data ?? null) as LearningCourseReview | null;
  } catch (error) {
    logger.error("submitCourseReview error", { error });
    toast.error("Failed to submit review");
    return null;
  }
}
