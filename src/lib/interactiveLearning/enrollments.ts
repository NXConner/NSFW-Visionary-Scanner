import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LearningEnrollment } from "./types";

export async function enrollInCourse(courseId: string): Promise<LearningEnrollment | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to enroll");
      return null;
    }

    const { data: existing } = await supabase
      .from("learning_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      toast.info("You are already enrolled in this course");
      return existing as LearningEnrollment;
    }

    const { data, error } = await supabase
      .from("learning_enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress_percentage: 0,
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    // Best-effort counter increment (if column exists and RLS allows)
    try {
      const { data: courseRow } = await supabase
        .from("learning_courses")
        .select("enrollment_count")
        .eq("id", courseId)
        .maybeSingle();
      const current = Number(
        (courseRow as { enrollment_count?: number | null } | null)?.enrollment_count || 0,
      );
      await supabase
        .from("learning_courses")
        .update({ enrollment_count: current + 1 })
        .eq("id", courseId);
    } catch {
      // ignore
    }

    toast.success("Successfully enrolled in course!");
    return data as LearningEnrollment;
  } catch (error) {
    logger.error("Failed to enroll in course", { error });
    toast.error("Failed to enroll in course");
    return null;
  }
}

export async function getUserEnrollments(): Promise<LearningEnrollment[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("learning_enrollments")
      .select(
        `
        *,
        course:learning_courses(*)
      `,
      )
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []) as LearningEnrollment[];
  } catch (error) {
    logger.error("Failed to fetch enrollments", { error });
    return [];
  }
}

export async function updateEnrollmentProgressAfterLessonComplete(
  lessonId: string,
  courseIdHint?: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let courseId: string | null = courseIdHint ?? null;
    if (!courseId) {
      const { data: lesson } = await supabase
        .from("learning_lessons")
        .select("module_id")
        .eq("id", lessonId)
        .maybeSingle();
      if (!lesson) return;
      const { data: module } = await supabase
        .from("learning_modules")
        .select("course_id")
        .eq("id", (lesson as { module_id: string }).module_id)
        .maybeSingle();
      if (!module) return;
      courseId = (module as { course_id: string }).course_id;
    }

    const { data: moduleRows } = await supabase
      .from("learning_modules")
      .select("id")
      .eq("course_id", courseId);
    const moduleIds = (moduleRows || []).map((m: any) => String(m.id));
    if (moduleIds.length === 0) return;

    const { data: allLessons } = await supabase
      .from("learning_lessons")
      .select("id")
      .in("module_id", moduleIds);
    const lessonIds = (allLessons || []).map((l: any) => String(l.id));
    if (lessonIds.length === 0) return;

    const { data: completedLessons } = await supabase
      .from("learning_lesson_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .in("lesson_id", lessonIds);

    const progress = Math.round(((completedLessons?.length || 0) / lessonIds.length) * 100);

    await supabase
      .from("learning_enrollments")
      .update({
        progress_percentage: progress,
        current_lesson_id: lessonId,
        last_accessed_at: new Date().toISOString(),
        ...(progress === 100 ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq("user_id", user.id)
      .eq("course_id", courseId);
  } catch (error) {
    logger.error("Failed to update enrollment progress", { error });
  }
}
