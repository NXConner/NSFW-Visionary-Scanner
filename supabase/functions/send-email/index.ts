import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  to: string;
  subject: string;
  content: string;
  campaignId?: string;
};

function sanitizeNotificationText(input: unknown): string {
  const s = typeof input === "string" ? input : input == null ? "" : String(input);
  return s
    .replace(/\b(nsfw|explicit|porn|sexual|sex|adult(-only)?|18\+)\b/gi, "private")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  apiKey: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  return { id: String(json?.id ?? "") };
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let userId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userRes, error: authError } = await supabaseClient.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    // Require admin to send emails
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(10);

    const isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const to = String(body.to || "").trim();
    const subject = sanitizeNotificationText(body.subject);
    const content = String(body.content || "").replace(
      /\b(nsfw|explicit|porn|sexual|sex|adult(-only)?|18\+)\b/gi,
      "private",
    );
    const campaignId = body.campaignId ? String(body.campaignId) : null;

    if (!to || !subject || !content) {
      return new Response(JSON.stringify({ error: "Missing to/subject/content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = "resend";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const from =
      Deno.env.get("EMAIL_FROM") ?? "Pavement Performance Suite <n8ter8@gmail.com>";

    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Create event (queued)
    const { data: ev, error: evErr } = await supabaseClient
      .from("email_send_events")
      .insert({
        campaign_id: campaignId,
        user_id: null,
        to_email: to,
        provider,
        provider_message_id: null,
        status: "queued",
        error_message: null,
        sent_at: null,
      })
      .select("*")
      .single();

    if (evErr) throw evErr;

    const sent = await sendViaResend({ to, subject, html: content, from, apiKey: resendKey });

    await supabaseClient
      .from("email_send_events")
      .update({
        provider_message_id: sent.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", ev.id);

    return new Response(JSON.stringify({ ok: true, provider, id: sent.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
