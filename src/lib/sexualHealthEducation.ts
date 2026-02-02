/**
 * Comprehensive Sexual Health Education System
 * Supabase-backed implementation.
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface EducationModule {
  id?: string;
  title: string;
  description?: string;
  category:
    | "anatomy"
    | "function"
    | "conditions"
    | "treatment"
    | "prevention"
    | "wellness"
    | "relationships"
    | "myths";
  difficulty_level?: "beginner" | "intermediate" | "advanced";
  age_group?: "18-25" | "26-35" | "36-45" | "46-55" | "56+" | "all";
  estimated_duration_minutes?: number;
  content_type?: "article" | "video" | "interactive" | "quiz" | "assessment";
  content_text?: string;
  content_html?: string;
  video_url?: string;
  thumbnail_url?: string;
  author?: string;
  expert_reviewed?: boolean;
  view_count?: number;
  rating_average?: number;
  rating_count?: number;
  order_index?: number;
  is_featured?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InteractiveContent {
  id?: string;
  module_id?: string;
  content_type: "quiz" | "assessment" | "interactive_guide";
  title: string;
  description?: string;
  questions: unknown;
  answers?: unknown;
  passing_score?: number;
  completion_count?: number;
  average_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProgress {
  id?: string;
  user_id?: string;
  module_id: string;
  progress_percentage?: number;
  time_spent_minutes?: number;
  last_accessed_at?: string;
  completed_at?: string;
  is_completed?: boolean;
  quiz_score?: number;
  quiz_attempts?: number;
  quiz_completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EducationQA {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  answered_by?: string;
  expert_verified?: boolean;
  source_url?: string;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  tags?: string[];
  related_module_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExpertContent {
  id?: string;
  expert_name: string;
  expert_title?: string;
  expert_credentials?: string;
  expert_bio?: string;
  expert_image_url?: string;
  content_type?: "interview" | "article" | "video" | "webinar";
  title: string;
  description?: string;
  content_text?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  transcript?: string;
  topics?: string[];
  tags?: string[];
  is_premium?: boolean;
  view_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchUpdate {
  id?: string;
  title: string;
  summary: string;
  full_article?: string;
  source_url?: string;
  source_name?: string;
  category?: "research" | "news" | "breakthrough" | "study" | "guideline";
  tags?: string[];
  published_date?: string;
  relevance_score?: number;
  created_at?: string;
  updated_at?: string;
}

export type BookmarkContentType = "module" | "qa" | "expert_content" | "research_update";

async function requireUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please sign in");
    return null;
  }
  return user.id;
}

export async function getEducationModules(
  category?: string,
  featured?: boolean,
  premiumOnly?: boolean,
): Promise<EducationModule[]> {
  try {
    let query = fromExtended("sexual_health_education_modules")
      .select("*")
      .order("order_index", { ascending: true })
      .limit(50);
    if (category) query = query.eq("category", category);
    if (featured) query = query.eq("is_featured", true);
    if (premiumOnly) query = query.eq("is_premium", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as EducationModule[];
  } catch (error) {
    logger.error("Failed to fetch education modules", { error });
    return [];
  }
}

export async function getEducationModule(moduleId: string): Promise<EducationModule | null> {
  try {
    const { data, error } = await fromExtended("sexual_health_education_modules")
      .select("*")
      .eq("id", moduleId)
      .maybeSingle();
    if (error) throw error;

    // best-effort view increment
    if (data) {
      void fromExtended("sexual_health_education_modules")
        .update({
          view_count:
            (data as { view_count?: number | null }).view_count != null
              ? Number((data as { view_count: number }).view_count) + 1
              : 1,
        })
        .eq("id", moduleId);
    }

    return (data as unknown as EducationModule | null) ?? null;
  } catch (error) {
    logger.error("Failed to fetch education module", { error });
    return null;
  }
}

export async function getInteractiveContent(moduleId: string): Promise<InteractiveContent[]> {
  try {
    const { data, error } = await fromExtended("education_interactive_content")
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as InteractiveContent[];
  } catch (error) {
    logger.error("Failed to fetch interactive content", { error });
    return [];
  }
}

export async function getUserProgress(moduleId?: string): Promise<UserProgress[]> {
  try {
    const userId = await requireUserId();
    if (!userId) return [];
    let q = fromExtended("education_user_progress")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (moduleId) q = q.eq("module_id", moduleId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as UserProgress[];
  } catch (error) {
    logger.error("Failed to fetch user progress", { error });
    return [];
  }
}

export async function updateUserProgress(
  moduleId: string,
  progress: Partial<UserProgress>,
): Promise<UserProgress> {
  const userId = await requireUserId();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  try {
    const { data, error } = await fromExtended("education_user_progress")
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          ...progress,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,module_id" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as UserProgress;
  } catch (error) {
    logger.error("Failed to update progress", { error });
    toast.error("Failed to save progress");
    throw error;
  }
}

export async function completeModule(moduleId: string): Promise<void> {
  await updateUserProgress(moduleId, {
    progress_percentage: 100,
    is_completed: true,
    completed_at: new Date().toISOString(),
  });
}

export async function getEducationQA(
  category?: string,
  searchQuery?: string,
): Promise<EducationQA[]> {
  try {
    let q = fromExtended("education_qa")
      .select("*")
      .order("helpful_count", { ascending: false })
      .limit(50);
    if (category) q = q.eq("category", category);
    if (searchQuery) q = q.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as EducationQA[];
  } catch (error) {
    logger.error("Failed to fetch education QA", { error });
    return [];
  }
}

export async function markQAHelpful(qaId: string, helpful: boolean): Promise<void> {
  try {
    const userId = await requireUserId();
    if (!userId) return;
    const { error } = await fromExtended("education_qa_interactions")
      .upsert(
        { user_id: userId, qa_id: qaId, was_helpful: helpful },
        { onConflict: "user_id,qa_id" },
      );
    if (error) throw error;
    toast.success(helpful ? "Marked as helpful" : "Marked as not helpful");
  } catch (error) {
    logger.error("Failed to record QA feedback", { error });
    toast.error("Failed to save feedback");
  }
}

export async function getExpertContent(limit?: number): Promise<ExpertContent[]> {
  try {
    const { data, error } = await fromExtended("education_expert_content")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) throw error;
    return (data || []) as unknown as ExpertContent[];
  } catch (error) {
    logger.error("Failed to fetch expert content", { error });
    return [];
  }
}

export async function getResearchUpdates(
  category?: string,
  limit?: number,
): Promise<ResearchUpdate[]> {
  try {
    let q = fromExtended("education_research_updates")
      .select("*")
      .order("published_date", { ascending: false })
      .limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as ResearchUpdate[];
  } catch (error) {
    logger.error("Failed to fetch research updates", { error });
    return [];
  }
}

export async function getUserEducationCompletion(): Promise<number> {
  try {
    const userId = await requireUserId();
    if (!userId) return 0;
    const [{ count: total }, { count: completed }] = await Promise.all([
      fromExtended("sexual_health_education_modules").select("id", { count: "exact", head: true }),
      fromExtended("education_user_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true),
    ]);
    const t = total || 0;
    if (t === 0) return 0;
    return ((completed || 0) / t) * 100;
  } catch (error) {
    logger.error("Failed to compute education completion", { error });
    return 0;
  }
}

export async function bookmarkContent(
  contentType: BookmarkContentType,
  contentId: string,
  notes?: string,
): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const { error } = await fromExtended("education_bookmarks")
    .upsert(
      { user_id: userId, content_type: contentType, content_id: contentId, notes: notes ?? null },
      { onConflict: "user_id,content_type,content_id" },
    );
  if (error) throw error;
}

export async function getBookmarks(contentType?: BookmarkContentType): Promise<
  Array<{
    id: string;
    content_type: BookmarkContentType;
    content_id: string;
    notes?: string | null;
  }>
> {
  try {
    const userId = await requireUserId();
    if (!userId) return [];
    let q = fromExtended("education_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (contentType) q = q.eq("content_type", contentType);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as Array<{
      id: string;
      content_type: BookmarkContentType;
      content_id: string;
      notes?: string | null;
    }>;
  } catch (error) {
    logger.error("Failed to fetch bookmarks", { error });
    return [];
  }
}
