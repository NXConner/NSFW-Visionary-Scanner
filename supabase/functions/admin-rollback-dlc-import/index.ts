import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPER_ADMIN_EMAIL = "n8ter8@gmail.com";

type ReqBody = {
  jobId: string;
  reason?: string;
  dryRun?: boolean;
};

async function isAdminUser(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL) return true;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return false;
  return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const okAdmin = await isAdminUser(supabase, user.id, user.email);
    if (!okAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const jobId = String(body.jobId || "").trim();
    const dryRun = Boolean(body.dryRun);
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: jobError } = await supabase
      .from("dlc_content_import_jobs")
      .select("id, import_type, summary")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Import job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from("dlc_content_import_job_items")
      .select("item_key, status, action")
      .eq("job_id", jobId);
    if (itemsError) throw new Error(itemsError.message);

    const createdKeys = (items || [])
      .filter((i: any) => i.action === "created" && i.status === "completed")
      .map((i: any) => String(i.item_key))
      .filter(Boolean);
    const updatedKeys = (items || [])
      .filter((i: any) => i.action === "updated" && i.status === "completed")
      .map((i: any) => String(i.item_key))
      .filter(Boolean);

    let deleted = 0;
    if (!dryRun && createdKeys.length > 0) {
      if (job.import_type === "positions") {
        const { error } = await supabase
          .from("nsfw_positions_gallery")
          .delete()
          .in("position_slug", createdKeys);
        if (error) throw new Error(error.message);
        deleted = createdKeys.length;
      } else if (job.import_type === "videos") {
        const { error } = await supabase
          .from("nsfw_video_content")
          .delete()
          .or(
            `source_import_key.in.(${createdKeys.map(k => `"${k}"`).join(",")}),content_slug.in.(${createdKeys.map(k => `"${k}"`).join(",")})`,
          );
        if (error) throw new Error(error.message);
        deleted = createdKeys.length;
      } else if (job.import_type === "topics") {
        const { error } = await supabase
          .from("nsfw_topic_library_items")
          .delete()
          .in("source_import_key", createdKeys);
        if (error) throw new Error(error.message);
        deleted = createdKeys.length;
      }
    }

    const nowIso = new Date().toISOString();
    const summary = typeof job.summary === "object" && job.summary ? job.summary : {};
    const rollbackSummary = {
      dryRun,
      deleted,
      createdKeys: createdKeys.slice(0, 200),
      updatedNotReverted: updatedKeys.slice(0, 200),
      updatedCount: updatedKeys.length,
      rolledBackAt: nowIso,
      reason: body.reason ?? null,
    };

    if (!dryRun) {
      await supabase
        .from("dlc_content_import_jobs")
        .update({ summary: { ...summary, rollback: rollbackSummary }, updated_at: nowIso })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        jobId,
        importType: job.import_type,
        dryRun,
        deleted,
        createdCount: createdKeys.length,
        updatedCount: updatedKeys.length,
        rollback: rollbackSummary,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-rollback-dlc-import error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
