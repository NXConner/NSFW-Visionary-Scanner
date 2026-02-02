import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { LearningCourse, LearningLesson, LearningModule } from "./types";

export async function getLearningCourses(
  category?: string,
  featured?: boolean,
  premiumOnly?: boolean,
  limit: number = 50,
): Promise<LearningCourse[]> {
  try {
    let query = supabase
      .from("learning_courses")
      .select("*")
      .order("order_index", { ascending: true })
      .limit(limit);
    if (category) query = query.eq("category", category);
    if (featured) query = query.eq("is_featured", true);
    if (premiumOnly) query = query.eq("is_premium", true);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as LearningCourse[];
  } catch (error) {
    logger.error("Failed to fetch courses", { error });
    return [];
  }
}

export async function getLearningCourse(courseId: string): Promise<{
  course: LearningCourse | null;
  modules: LearningModule[];
  lessons: LearningLesson[];
}> {
  try {
    const [courseResult, modulesResult] = await Promise.all([
      supabase.from("learning_courses").select("*").eq("id", courseId).maybeSingle(),
      supabase.from("learning_modules").select("*").eq("course_id", courseId).order("order_index"),
    ]);

    if (courseResult.error) throw courseResult.error;
    if (modulesResult.error) throw modulesResult.error;

    const modules = (modulesResult.data || []) as LearningModule[];
    const moduleIds = modules.map(m => m.id);

    let lessons: LearningLesson[] = [];
    if (moduleIds.length > 0) {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("learning_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("order_index");
      if (lessonsError) throw lessonsError;
      lessons = (lessonsData || []) as LearningLesson[];
    }

    return { course: (courseResult.data as LearningCourse | null) ?? null, modules, lessons };
  } catch (error) {
    logger.error("Failed to fetch course details", { error });
    return { course: null, modules: [], lessons: [] };
  }
}

export async function searchCourses(query: string): Promise<LearningCourse[]> {
  try {
    const { data, error } = await supabase
      .from("learning_courses")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return (data || []) as LearningCourse[];
  } catch (error) {
    logger.error("Failed to search courses", { error });
    return [];
  }
}
