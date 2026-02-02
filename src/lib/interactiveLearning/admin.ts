import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { LearningLesson } from "@/lib/interactiveLearning/types";

async function isAdminUser(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  try {
    const { data } = await fromExtended("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .limit(10);
    return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
  } catch {
    return false;
  }
}

export async function updateLearningLesson(
  lessonId: string,
  updates: Partial<
    Pick<
      LearningLesson,
      | "title"
      | "content_type"
      | "content_data"
      | "estimated_duration_minutes"
      | "order_index"
      | "requires_completion_of"
    >
  >,
): Promise<boolean> {
  try {
    const ok = await isAdminUser();
    if (!ok) {
      toast.error("Admin access required");
      return false;
    }

    const { error } = await fromExtended("learning_lessons")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (error) {
      logger.error("updateLearningLesson failed", { error: error.message, lessonId });
      toast.error("Failed to update lesson");
      return false;
    }

    toast.success("Lesson updated");
    return true;
  } catch (error) {
    logger.error("updateLearningLesson error", { error, lessonId });
    toast.error("Failed to update lesson");
    return false;
  }
}
