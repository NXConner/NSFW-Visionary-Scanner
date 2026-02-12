import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LearningPath } from "./types";

type LearningPathRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  path_type: string | null;
  course_ids: string[];
  current_course_index: number | null;
  progress_percentage: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapPath(row: LearningPathRow): LearningPath {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    path_type: row.path_type,
    course_ids: row.course_ids || [],
    current_course_index: row.current_course_index,
    progress_percentage: row.progress_percentage,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getLearningPaths(): Promise<LearningPath[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("learning_paths")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      logger.error("Failed to fetch learning paths", { error: error.message });
      return [];
    }
    return ((data || []) as unknown as LearningPathRow[]).map(mapPath);
  } catch (err) {
    logger.error("Failed to fetch learning paths", { error: err });
    return [];
  }
}

export async function createLearningPath(
  name: string,
  courseIds: string[],
  description?: string,
): Promise<LearningPath | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data, error } = await supabase
      .from("learning_paths")
      .insert({
        user_id: user.id,
        name,
        description: description ?? null,
        path_type: "custom",
        course_ids: courseIds,
        current_course_index: 0,
        progress_percentage: 0,
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to create learning path", { error: error.message });
      toast.error("Failed to create learning path");
      return null;
    }

    toast.success("Learning path created");
    return mapPath(data as unknown as LearningPathRow);
  } catch (err) {
    logger.error("Failed to create learning path", { error: err });
    toast.error("Failed to create learning path");
    return null;
  }
}
