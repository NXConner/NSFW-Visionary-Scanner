import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { ExpertArticle } from "@/lib/expertContentConsultations/types";

function mapExpertArticle(row: any): ExpertArticle {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    title: String(row.article_title ?? ""),
    content: String(row.article_content ?? ""),
    category: row.category ?? null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : null,
    is_featured: Boolean(row.is_featured),
    view_count: Number(row.view_count ?? 0),
    like_count: Number(row.like_count ?? 0),
    published_at: row.published_at ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getExpertArticles(
  expertId?: string,
  category?: string,
  featured?: boolean,
): Promise<ExpertArticle[]> {
  try {
    let q = fromExtended("expert_articles")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (expertId) q = q.eq("expert_id", expertId);
    if (category) q = q.eq("category", category);
    if (featured) q = q.eq("is_featured", true);

    const { data, error } = await q;
    if (error) {
      logger.error("getExpertArticles failed", { error: error.message });
      return [];
    }
    return (data || []).map(mapExpertArticle);
  } catch (error) {
    logger.error("getExpertArticles error", { error });
    return [];
  }
}
