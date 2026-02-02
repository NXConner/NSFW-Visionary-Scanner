import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { EducationModule } from "@/lib/sexualHealthEducation";

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

export async function updateSexualHealthEducationModule(
  moduleId: string,
  updates: Partial<
    Pick<
      EducationModule,
      | "title"
      | "description"
      | "content_text"
      | "content_html"
      | "video_url"
      | "thumbnail_url"
      | "author"
      | "expert_reviewed"
      | "is_featured"
      | "is_premium"
      | "order_index"
      | "estimated_duration_minutes"
      | "content_type"
      | "category"
      | "difficulty_level"
      | "age_group"
    >
  >,
): Promise<boolean> {
  try {
    const ok = await isAdminUser();
    if (!ok) {
      toast.error("Admin access required");
      return false;
    }

    const { error } = await fromExtended("sexual_health_education_modules")
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    if (error) {
      logger.error("updateSexualHealthEducationModule failed", { error: error.message, moduleId });
      toast.error("Failed to update module");
      return false;
    }

    toast.success("Module updated");
    return true;
  } catch (error) {
    logger.error("updateSexualHealthEducationModule error", { error, moduleId });
    toast.error("Failed to update module");
    return false;
  }
}
