import type { ImportPayload, ImportType, ParsedCsvRow } from "./types";
import { splitPipeList, toBool } from "./utils";

export function buildImportPayloadFromCsvRows(
  tab: ImportType,
  rows: ParsedCsvRow[],
): ImportPayload {
  if (tab === "positions") {
    const items = rows.map(r => ({
      position_slug: r.position_slug,
      position_name: r.position_name,
      description: r.description,
      detailed_instructions: r.detailed_instructions || null,
      category: r.category,
      difficulty_level: (r.difficulty_level as any) || null,
      intimacy_level: (r.intimacy_level as any) || null,
      required_flexibility: (r.required_flexibility as any) || null,
      tags: splitPipeList(r.tags),
      benefits: splitPipeList(r.benefits),
      tips: splitPipeList(r.tips),
      image_url: r.image_url || null,
      image_url_illustrated: r.image_url_illustrated || null,
      thumbnail_url: r.thumbnail_url || null,
      video_tutorial_url: r.video_tutorial_url || null,
      animation_url: r.animation_url || null,
      // optional local file references (uploaded before import when enabled)
      image_file: r.image_file || null,
      image_illustrated_file: r.image_illustrated_file || null,
      thumbnail_file: r.thumbnail_file || null,
      video_tutorial_file: r.video_tutorial_file || null,
      animation_file: r.animation_file || null,
      sort_order: r.sort_order ? Number(r.sort_order) : 0,
      is_premium: toBool(r.is_premium),
      requires_dlc: toBool(r.requires_dlc),
      is_active: r.is_active ? toBool(r.is_active) : true,
    }));
    return { importType: "positions", items };
  }

  if (tab === "videos") {
    const items = rows.map(r => ({
      content_slug: r.content_slug || null,
      source_import_key: r.source_import_key || null,
      title: r.title,
      description: r.description,
      category: r.category,
      video_url_sd: r.video_url_sd || null,
      video_url_hd: r.video_url_hd || null,
      video_url_4k: r.video_url_4k || null,
      thumbnail_url: r.thumbnail_url || null,
      preview_gif_url: r.preview_gif_url || null,
      // optional local file references
      video_sd_file: r.video_sd_file || null,
      video_hd_file: r.video_hd_file || null,
      video_4k_file: r.video_4k_file || null,
      thumbnail_file: r.thumbnail_file || null,
      preview_gif_file: r.preview_gif_file || null,
      tags: splitPipeList(r.tags),
      difficulty_level: (r.difficulty_level as any) || null,
      content_rating: (r.content_rating as any) || null,
      expert_name: r.expert_name || null,
      expert_credentials: r.expert_credentials || null,
      key_points: splitPipeList(r.key_points),
      warnings: splitPipeList(r.warnings),
      prerequisites: splitPipeList(r.prerequisites),
      is_premium: toBool(r.is_premium),
      is_featured: toBool(r.is_featured),
      requires_dlc: toBool(r.requires_dlc),
      dlc_pack_id: r.dlc_pack_id || null,
      is_approved: toBool(r.is_approved),
      is_active: r.is_active ? toBool(r.is_active) : true,
    }));
    return { importType: "videos", items };
  }

  const items = rows.map(r => ({
    topic_id: r.topic_id,
    title: r.title,
    summary: r.summary || null,
    body: r.body || null,
    resources: (() => {
      const raw = String(r.resources || "").trim();
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    })(),
    tags: splitPipeList(r.tags),
    content_rating: (r.content_rating as any) || "educational",
    source_import_key: r.source_import_key || null,
    requires_feature_id: r.requires_feature_id || null,
    requires_dlc: r.requires_dlc ? toBool(r.requires_dlc) : true,
    is_active: r.is_active ? toBool(r.is_active) : true,
  }));
  return { importType: "topics", items };
}
