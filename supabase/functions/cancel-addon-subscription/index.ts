import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = { addonId: string };

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { addonId } = (await req.json()) as ReqBody;
    const id = String(addonId || "");
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing addonId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) throw new Error("Invalid authentication");

    const { data: row, error: rowErr } = await supabase
      .from("user_add_ons")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("addon_id", id)
      .maybeSingle();

    if (rowErr || !row?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "No active add-on subscription" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    await stripe.subscriptions.update(String(row.stripe_subscription_id), {
      cancel_at_period_end: true,
    } as any);

    await supabase
      .from("user_add_ons")
      .update({ cancel_at_period_end: true })
      .eq("user_id", user.id)
      .eq("addon_id", id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("cancel-addon-subscription error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
