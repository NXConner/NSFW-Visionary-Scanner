import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  resolveEmailFromEnv,
  sanitizeNotificationText,
  sendResendEmail,
} from "../_shared/email.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

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

    // Require privileged user (admin/super_admin) to send emails.
    // Uses DB roles + core-email allowlist via shared helper.
    const { isPrivileged } = await getPrivilegedFlags(supabaseClient, user.id, user.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rate = await enforceRateLimit({
      identifier: user.id,
      endpoint: "send-email",
      windowSeconds: 60,
      maxRequests: 20,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
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
    const from = resolveEmailFromEnv();

    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Create event (queued)
    let eventId: string | null = null;
    const { data: ev, error: evErr } = await supabaseClient
      .from("email_send_events")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        to_email: to,
        subject,
        provider,
        provider_message_id: null,
        status: "queued",
        error_message: null,
        sent_at: null,
      })
      .select("*")
      .single();

    if (evErr) throw evErr;
    eventId = ev?.id ? String(ev.id) : null;

    try {
      const sent = await sendResendEmail({ to, subject, html: content, from, apiKey: resendKey });

      await supabaseClient
        .from("email_send_events")
        .update({
          provider_message_id: sent.id,
          status: "sent",
          error_message: null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", ev.id);

      return new Response(JSON.stringify({ ok: true, provider, id: sent.id }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      if (eventId) {
        await supabaseClient
          .from("email_send_events")
          .update({
            status: "failed",
            error_message: msg,
            sent_at: new Date().toISOString(),
          })
          .eq("id", eventId);
      }
      throw sendErr;
    }
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
