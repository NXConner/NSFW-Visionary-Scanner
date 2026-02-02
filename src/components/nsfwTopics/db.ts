import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { NsfwTopic, NsfwTopicLibraryItem } from "./types";

function coerceResources(v: unknown): Array<{ label: string; url: string }> | null {
  if (!Array.isArray(v)) return null;
  const out: Array<{ label: string; url: string }> = [];
  for (const r of v) {
    if (r && typeof r === "object") {
      const label = String((r as any).label ?? (r as any).title ?? "").trim();
      const url = String((r as any).url ?? "").trim();
      if (label && url) out.push({ label, url });
    }
  }
  return out.length > 0 ? out : null;
}

export async function fetchNsfwTopics(): Promise<NsfwTopic[]> {
  const { data, error } = await fromExtended("nsfw_topics")
    .select("topic_id,display_name,description,requires_feature_id,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);

  const rows = (data || []) as any[];
  return rows.map(r => ({
    topicId: String(r.topic_id),
    displayName: String(r.display_name),
    description: r.description == null ? null : String(r.description),
    requiresFeatureId: String(r.requires_feature_id),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

export async function fetchTopicLibraryItems({
  topicId,
  requiresFeatureIds,
}: {
  topicId: string | null;
  requiresFeatureIds: string[];
}): Promise<NsfwTopicLibraryItem[]> {
  let q = fromExtended("nsfw_topic_library_items")
    .select(
      "id,topic_id,title,summary,body,resources,tags,content_rating,requires_feature_id,is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(500);

  if (topicId) q = q.eq("topic_id", topicId);
  if (requiresFeatureIds.length > 0) q = q.in("requires_feature_id", requiresFeatureIds);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data || []) as any[];

  return rows.map(r => ({
    id: String(r.id),
    topicId: String(r.topic_id),
    title: String(r.title),
    summary: r.summary == null ? null : String(r.summary),
    body: r.body == null ? null : String(r.body),
    resources: coerceResources(r.resources),
    tags: Array.isArray(r.tags) ? r.tags.map((t: any) => String(t)).filter(Boolean) : [],
    contentRating: (String(r.content_rating || "educational") as any) ?? "educational",
    requiresFeatureId: String(r.requires_feature_id),
  }));
}
