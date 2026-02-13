/**
 * Supabase Edge Function: Generate Referral Code
 * Generates a unique referral code for a user
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has an active referral code
    const { data: existing } = await supabaseClient
      .from("referral_codes")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .single();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique code
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 8-character alphanumeric code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code exists
      const { data: check } = await supabaseClient
        .from("referral_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!check) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return new Response(JSON.stringify({ error: "Failed to generate unique code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create referral code
    const { data: newCode, error } = await supabaseClient
      .from("referral_codes")
      .insert({
        user_id,
        code: code!,
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(newCode), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
