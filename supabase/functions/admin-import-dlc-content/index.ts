import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ImportType = "positions" | "videos" | "topics";

type BaseReq = {
  importType: ImportType;
  sourceFileName?: string;
  sourceSha256?: string;
  dryRun?: boolean;
};

type PositionsItem = {
  position_slug: string;
  position_name: string;
  description: string;
  detailed_instructions?: string | null;
  category: string;
  difficulty_level?: "beginner" | "intermediate" | "advanced" | "expert";
  intimacy_level?: "low" | "medium" | "high" | "very_high";
  required_flexibility?: "none" | "some" | "moderate" | "high";
  tags?: string[];
  benefits?: string[];
  tips?: string[];
  image_url?: string | null;
  image_url_illustrated?: string | null;
  thumbnail_url?: string | null;
  video_tutorial_url?: string | null;
  animation_url?: string | null;
  sort_order?: number;
  is_premium?: boolean;
  requires_dlc?: boolean;
  is_active?: boolean;
};

type VideosItem = {
  content_slug?: string | null;
  source_import_key?: string | null;
  title: string;
  description: string;
  category:
    | "technique"
    | "tutorial"
    | "expert_interview"
    | "educational"
    | "demonstration"
    | "advanced"
    | "beginner";
  video_url_sd?: string | null;
  video_url_hd?: string | null;
  video_url_4k?: string | null;
  thumbnail_url?: string | null;
  preview_gif_url?: string | null;
  tags?: string[];
  difficulty_level?: "beginner" | "intermediate" | "advanced" | "expert";
  content_rating?: "educational" | "demonstrative" | "explicit";
  expert_name?: string | null;
  expert_credentials?: string | null;
  step_by_step_guide?: unknown;
  key_points?: string[];
  warnings?: string[];
  prerequisites?: string[];
  is_premium?: boolean;
  is_featured?: boolean;
  requires_dlc?: boolean;
  dlc_pack_id?: string | null;
  is_approved?: boolean;
  is_active?: boolean;
};

type TopicLibraryItem = {
  topic_id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  resources?: unknown;
  tags?: string[];
  content_rating?: "educational" | "demonstrative" | "explicit";
  source_import_key?: string | null;
  requires_feature_id?: string | null;
  requires_dlc?: boolean;
  is_active?: boolean;
};

type ReqBody =
  | (BaseReq & { importType: "positions"; items: PositionsItem[] })
  | (BaseReq & { importType: "videos"; items: VideosItem[] })
  | (BaseReq & { importType: "topics"; items: TopicLibraryItem[] });

function slugify(input: string): string {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(x => String(x || "").trim()).filter(Boolean);
}

const VIDEO_RATINGS = new Set(["educational", "demonstrative", "explicit"]);
const TOPIC_RATINGS = new Set(["educational", "demonstrative", "explicit"]);
const VIDEO_DIFFICULTY = new Set(["beginner", "intermediate", "advanced", "expert"]);
const POSITION_DIFFICULTY = new Set(["beginner", "intermediate", "advanced", "expert"]);

function normalizeEnum(value: unknown, allowed: Set<string>): string | null {
  if (value == null || value === "") return null;
  const normalized = String(value).trim().toLowerCase();
  return allowed.has(normalized) ? normalized : null;
}

function normalizeResources(value: unknown): unknown[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  return null;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "admin-import-dlc-content",
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { isPrivileged } = await getPrivilegedFlags(supabase, user.id, user.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const importType = body.importType;
    const dryRun = Boolean((body as any).dryRun);

    if ((body as any).items == null || !Array.isArray((body as any).items)) {
      return new Response(JSON.stringify({ error: "Missing items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create job
    const { data: jobRow, error: jobErr } = await supabase
      .from("dlc_content_import_jobs")
      .insert({
        created_by: user.id,
        import_type: importType,
        status: "processing",
        source_file_name: (body as any).sourceFileName ?? null,
        source_sha256: (body as any).sourceSha256 ?? null,
        summary: { dryRun, itemCount: (body as any).items.length },
      })
      .select("id")
      .maybeSingle();

    if (jobErr || !jobRow?.id) throw new Error(jobErr?.message || "Failed to create import job");
    const jobId = String(jobRow.id);

    const items = (body as any).items as any[];

    const results: Array<{
      key: string;
      status: "completed" | "skipped" | "failed";
      action: "created" | "updated" | "skipped" | "failed";
      error?: string;
    }> = [];

    if (importType === "positions") {
      for (const it of items as PositionsItem[]) {
        const key = String(it.position_slug || "").trim();
        const positionName = String(it.position_name || "").trim();
        const description = String(it.description || "").trim();
        const category = String(it.category || "").trim();
        if (!key || !positionName || !description || !category) {
          results.push({
            key: key || "(missing_slug)",
            status: "failed",
            action: "failed",
            error: "position_slug/position_name/description/category required",
          });
          continue;
        }

        const difficulty = normalizeEnum(it.difficulty_level, POSITION_DIFFICULTY);
        if (it.difficulty_level && !difficulty) {
          results.push({
            key,
            status: "failed",
            action: "failed",
            error: "difficulty_level invalid",
          });
          continue;
        }

        let action: "created" | "updated" = "created";
        try {
          const { data: existing } = await supabase
            .from("nsfw_positions_gallery")
            .select("id")
            .eq("position_slug", key)
            .maybeSingle();
          if (existing?.id) action = "updated";
        } catch {
          // ignore, fallback to created
        }

        const payload = {
          position_slug: key,
          position_name: positionName,
          description,
          detailed_instructions: it.detailed_instructions ?? null,
          category,
          difficulty_level: difficulty ?? null,
          intimacy_level: it.intimacy_level ?? null,
          required_flexibility: it.required_flexibility ?? null,
          tags: safeArray(it.tags),
          benefits: safeArray(it.benefits),
          tips: safeArray(it.tips),
          image_url: it.image_url ?? null,
          image_url_illustrated: it.image_url_illustrated ?? null,
          thumbnail_url: it.thumbnail_url ?? null,
          video_tutorial_url: it.video_tutorial_url ?? null,
          animation_url: it.animation_url ?? null,
          sort_order: Number.isFinite(Number(it.sort_order)) ? Number(it.sort_order) : 0,
          is_premium: Boolean(it.is_premium ?? false),
          requires_dlc: Boolean(it.requires_dlc ?? false),
          is_active: it.is_active == null ? true : Boolean(it.is_active),
          updated_at: new Date().toISOString(),
        };

        try {
          if (!dryRun) {
            const { error } = await supabase
              .from("nsfw_positions_gallery")
              .upsert(payload, { onConflict: "position_slug" });
            if (error) throw new Error(error.message);
          }
          results.push({ key, status: "completed", action });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upsert failed";
          results.push({ key, status: "failed", action: "failed", error: msg });
        }
      }
    }

    if (importType === "videos") {
      for (const it of items as VideosItem[]) {
        const slug = it.content_slug ? String(it.content_slug).trim() : slugify(it.title);
        const key = it.source_import_key ? String(it.source_import_key).trim() : slug;
        if (!it.title || !it.description || !it.category) {
          results.push({
            key: key || "(missing)",
            status: "failed",
            action: "failed",
            error: "title/description/category required",
          });
          continue;
        }

        const rating = normalizeEnum(it.content_rating, VIDEO_RATINGS) ?? "educational";
        if (it.content_rating && !normalizeEnum(it.content_rating, VIDEO_RATINGS)) {
          results.push({
            key: key || "(missing)",
            status: "failed",
            action: "failed",
            error: "content_rating invalid",
          });
          continue;
        }
        const difficulty = normalizeEnum(it.difficulty_level, VIDEO_DIFFICULTY);
        if (it.difficulty_level && !difficulty) {
          results.push({
            key: key || "(missing)",
            status: "failed",
            action: "failed",
            error: "difficulty_level invalid",
          });
          continue;
        }

        let action: "created" | "updated" = "created";
        try {
          if (key) {
            const { data: existing } = await supabase
              .from("nsfw_video_content")
              .select("id")
              .eq("source_import_key", key)
              .maybeSingle();
            if (existing?.id) action = "updated";
          } else if (slug) {
            const { data: existing } = await supabase
              .from("nsfw_video_content")
              .select("id")
              .eq("content_slug", slug)
              .maybeSingle();
            if (existing?.id) action = "updated";
          }
        } catch {
          // ignore; fallback to created
        }

        const payload = {
          content_slug: slug || null,
          source_import_key: key || null,
          title: String(it.title).trim(),
          description: String(it.description).trim(),
          category: String(it.category),
          video_url_sd: it.video_url_sd ?? null,
          video_url_hd: it.video_url_hd ?? null,
          video_url_4k: it.video_url_4k ?? null,
          thumbnail_url: it.thumbnail_url ?? null,
          preview_gif_url: it.preview_gif_url ?? null,
          tags: safeArray(it.tags),
          difficulty_level: difficulty ?? null,
          content_rating: rating ?? null,
          expert_name: it.expert_name ?? null,
          expert_credentials: it.expert_credentials ?? null,
          step_by_step_guide: (it.step_by_step_guide ?? null) as any,
          key_points: safeArray(it.key_points),
          warnings: safeArray(it.warnings),
          prerequisites: safeArray(it.prerequisites),
          is_premium: Boolean(it.is_premium ?? false),
          is_featured: Boolean(it.is_featured ?? false),
          requires_dlc: Boolean(it.requires_dlc ?? false),
          dlc_pack_id: it.dlc_pack_id ?? null,
          is_approved: it.is_approved == null ? false : Boolean(it.is_approved),
          is_active: it.is_active == null ? true : Boolean(it.is_active),
          updated_at: new Date().toISOString(),
        };

        try {
          if (!dryRun) {
            // Prefer upsert by source_import_key when present, otherwise by content_slug.
            const conflict = key ? "source_import_key" : "content_slug";
            const { error } = await supabase.from("nsfw_video_content").upsert(payload, {
              onConflict: conflict,
            });
            if (error) throw new Error(error.message);
          }
          results.push({ key: key || slug, status: "completed", action });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upsert failed";
          results.push({ key: key || slug, status: "failed", action: "failed", error: msg });
        }
      }
    }

    if (importType === "topics") {
      for (const it of items as TopicLibraryItem[]) {
        const topicId = String(it.topic_id || "").trim();
        const title = String(it.title || "").trim();
        const key = it.source_import_key
          ? String(it.source_import_key).trim()
          : `${topicId}:${slugify(title)}`;
        if (!topicId || !title) {
          results.push({
            key: key || "(missing)",
            status: "failed",
            action: "failed",
            error: "topic_id and title required",
          });
          continue;
        }

        try {
          const rating = normalizeEnum(it.content_rating, TOPIC_RATINGS) ?? "educational";
          if (it.content_rating && !normalizeEnum(it.content_rating, TOPIC_RATINGS)) {
            results.push({
              key,
              status: "failed",
              action: "failed",
              error: "content_rating invalid",
            });
            continue;
          }
          const resources = normalizeResources(it.resources);
          if (it.resources != null && resources == null) {
            results.push({
              key,
              status: "failed",
              action: "failed",
              error: "resources must be an array",
            });
            continue;
          }

          let action: "created" | "updated" = "created";
          try {
            const { data: existing } = await supabase
              .from("nsfw_topic_library_items")
              .select("id")
              .eq("source_import_key", key)
              .maybeSingle();
            if (existing?.id) action = "updated";
          } catch {
            // ignore
          }

          // Ensure topic exists; default required_feature_id if missing.
          // (Service role used by this function can upsert the taxonomy table.)
          let requiresFeatureId = it.requires_feature_id
            ? String(it.requires_feature_id).trim()
            : "";
          if (!requiresFeatureId) {
            const { data: trow } = await supabase
              .from("nsfw_topics")
              .select("requires_feature_id")
              .eq("topic_id", topicId)
              .maybeSingle();
            requiresFeatureId = String(trow?.requires_feature_id || "").trim();
          }
          if (!requiresFeatureId) {
            requiresFeatureId = "topics_library";
            if (!dryRun) {
              await supabase.from("nsfw_topics").upsert(
                {
                  topic_id: topicId,
                  display_name: topicId,
                  description: null,
                  requires_feature_id: requiresFeatureId,
                  sort_order: 0,
                  is_active: true,
                  content_rating: "18+",
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "topic_id" },
              );
            }
          }

          const payload = {
            topic_id: topicId,
            source_import_key: key || null,
            title,
            summary: it.summary == null ? null : String(it.summary).trim(),
            body: it.body == null ? null : String(it.body),
            resources: (resources ?? []) as any,
            tags: safeArray(it.tags),
            content_rating: rating ?? "educational",
            requires_feature_id: requiresFeatureId,
            requires_dlc: it.requires_dlc == null ? true : Boolean(it.requires_dlc),
            is_active: it.is_active == null ? true : Boolean(it.is_active),
            updated_at: new Date().toISOString(),
          };

          if (!dryRun) {
            const { error } = await supabase
              .from("nsfw_topic_library_items")
              .upsert(payload, { onConflict: "source_import_key" });
            if (error) throw new Error(error.message);
          }

          results.push({ key, status: "completed", action });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upsert failed";
          results.push({ key, status: "failed", action: "failed", error: msg });
        }
      }
    }

    const completed = results.filter(r => r.status === "completed").length;
    const failed = results.filter(r => r.status === "failed").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const created = results.filter(r => r.action === "created").length;
    const updated = results.filter(r => r.action === "updated").length;

    if (!dryRun) {
      // Insert per-item rows (best-effort)
      try {
        const rows = results.map(r => ({
          job_id: jobId,
          item_key: r.key,
          status: r.status,
          action: r.action,
          error_message: r.error ?? null,
        }));
        if (rows.length > 0)
          await supabase
            .from("dlc_content_import_job_items")
            .upsert(rows, { onConflict: "job_id,item_key" });
      } catch {
        // ignore
      }

      await supabase
        .from("dlc_content_import_jobs")
        .update({
          status: failed > 0 ? "failed" : "completed",
          updated_at: new Date().toISOString(),
          summary: {
            dryRun,
            completed,
            failed,
            skipped,
            created,
            updated,
            itemCount: results.length,
          },
          error_message: failed > 0 ? "One or more items failed" : null,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        jobId,
        dryRun,
        summary: { completed, failed, skipped, created, updated, itemCount: results.length },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-import-dlc-content error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
