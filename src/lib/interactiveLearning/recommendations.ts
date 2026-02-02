import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { LearningCourse } from "./types";
import { getLearningCourses } from "./courses";

type RecommendationRow = {
  id: string;
  course: LearningCourse | null;
  priority: number | null;
  confidence_score: number | null;
  recommendation_reason: string | null;
};

export async function getRecommendedCourses(): Promise<LearningCourse[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return await getLearningCourses(undefined, true, false, 5);

    const { data, error } = await supabase
      .from("learning_recommendations")
      .select(
        `
        id,
        priority,
        confidence_score,
        recommendation_reason,
        course:learning_courses(*)
      `,
      )
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .limit(10);

    if (error) {
      logger.error("Failed to fetch learning recommendations", { error: error.message });
      return await getLearningCourses(undefined, true, false, 5);
    }

    const rows = (data || []) as RecommendationRow[];
    const courses = rows.map(r => r.course).filter(Boolean) as LearningCourse[];
    return courses.length > 0 ? courses : await getLearningCourses(undefined, true, false, 5);
  } catch (err) {
    logger.error("Failed to fetch learning recommendations", { error: err });
    return await getLearningCourses(undefined, true, false, 5);
  }
}

export async function getCourseRecommendations(): Promise<LearningCourse[]> {
  return getRecommendedCourses();
}
