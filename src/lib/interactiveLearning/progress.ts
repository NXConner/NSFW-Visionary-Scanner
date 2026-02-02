import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LearningLessonProgress } from "./types";
import { updateEnrollmentProgressAfterLessonComplete } from "./enrollments";
import { issueCertificate } from "./certificates";

export async function updateLessonProgress(
  lessonId: string,
  progress: Partial<LearningLessonProgress>,
): Promise<LearningLessonProgress | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
      .from("learning_lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("learning_lesson_progress")
        .update({
          ...progress,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as LearningLessonProgress;
    }

    const { data, error } = await supabase
      .from("learning_lesson_progress")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        ...progress,
        last_accessed_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as LearningLessonProgress;
  } catch (error) {
    logger.error("Failed to update lesson progress", { error });
    return null;
  }
}

export async function completeLesson(lessonId: string): Promise<void> {
  const result = await updateLessonProgress(lessonId, {
    is_completed: true,
    completion_percentage: 100,
    completed_at: new Date().toISOString(),
  });

  if (!result) return;

  toast.success("Lesson completed! 🎉");
  await updateEnrollmentProgressAfterLessonComplete(lessonId);

  // If enrollment progress hits 100, issue certificate (best effort).
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

    const courseId = (module as { course_id: string }).course_id;
    const { data: enrollment } = await supabase
      .from("learning_enrollments")
      .select("progress_percentage")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (
      Number(
        (enrollment as { progress_percentage?: number | null } | null)?.progress_percentage || 0,
      ) >= 100
    ) {
      await issueCertificate(courseId);
    }
  } catch {
    // ignore
  }
}

export async function getLessonProgress(lessonId: string): Promise<LearningLessonProgress | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("learning_lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) throw error;
    return (data as LearningLessonProgress | null) ?? null;
  } catch (error) {
    logger.error("Failed to fetch lesson progress", { error });
    return null;
  }
}

export async function getCourseProgress(courseId: string): Promise<number> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: enrollment } = await supabase
      .from("learning_enrollments")
      .select("progress_percentage")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    return Number(
      (enrollment as { progress_percentage?: number | null } | null)?.progress_percentage || 0,
    );
  } catch {
    return 0;
  }
}
