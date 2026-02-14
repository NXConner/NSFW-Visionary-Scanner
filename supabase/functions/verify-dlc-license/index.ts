// Verify DLC License
// Verifies and activates DLC licenses for NSFW content unlock.
//
// Notes:
// - Designed to be compatible with multiple historical schema variants.
// - Prefers device binding via dlc_license_devices (package-based schema),
//   but also tolerates a legacy dlc_licenses.device_id column if present.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function envTrue(name: string): boolean {
  const v = (Deno.env.get(name) ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { licenseKey, userId: bodyUserId, deviceId, devicePlatform } = await req.json();

    const { data: userRes, error: authError } = await supabaseClient.auth.getUser(token);
    const authedUser = userRes?.user;
    if (authError || !authedUser) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Back-compat: if caller provides userId, it must match the JWT user.
    if (bodyUserId && String(bodyUserId) !== authedUser.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authedUser.id;

    if (!licenseKey) {
      return new Response(JSON.stringify({ error: "Missing required fields: licenseKey" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional hard requirement: enforce device binding by refusing unsigned-device requests.
    // This is a defense-in-depth control against "omit deviceId to bypass limits".
    const requireDeviceBinding = envTrue("DLC_REQUIRE_DEVICE_BINDING");
    if (requireDeviceBinding && !deviceId) {
      return new Response(JSON.stringify({ error: "deviceId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify license key format (basic validation)
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey)) {
      return new Response(JSON.stringify({ error: "Invalid license key format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if license exists and is valid
    const { data: existingLicense, error: fetchError } = await supabaseClient
      .from("dlc_licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .single();

    if (fetchError || !existingLicense) {
      return new Response(JSON.stringify({ error: "Invalid license key" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if license is already assigned to another user
    if (existingLicense.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "License key already assigned to another user" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if license is expired (support legacy `expiration_date` and newer `subscription_end`)
    const expirationCandidate =
      (existingLicense as any).expiration_date ?? (existingLicense as any).subscription_end ?? null;
    if (expirationCandidate) {
      const expirationDate = new Date(expirationCandidate);
      if (expirationDate < new Date()) {
        return new Response(JSON.stringify({ error: "License key has expired" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if license is active
    if (!existingLicense.is_active) {
      return new Response(JSON.stringify({ error: "License key is not active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce revocation/refund flags used by Stripe webhooks (newer schema)
    if ((existingLicense as any).refunded_at || (existingLicense as any).deactivated_at) {
      return new Response(JSON.stringify({ error: "License has been revoked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Subscription status enforcement (fail closed if subscription is not active/trialing)
    if (
      String((existingLicense as any).license_type || "").toLowerCase() === "subscription" &&
      (existingLicense as any).subscription_status
    ) {
      const st = String((existingLicense as any).subscription_status || "").toLowerCase();
      if (st && st !== "active" && st !== "trialing") {
        return new Response(JSON.stringify({ error: "Subscription is not active" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Age gate + consent (server enforcement)
    const { data: age, error: ageError } = await supabaseClient
      .from("dlc_age_verifications")
      .select("is_verified, adult_content_consent, terms_accepted")
      .eq("user_id", userId)
      .maybeSingle();
    if (ageError) {
      console.error("Age verification query failed:", ageError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const okAge = Boolean(age?.is_verified && age?.adult_content_consent && age?.terms_accepted);
    if (!okAge) {
      return new Response(JSON.stringify({ error: "Age verification required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Device binding
    if (deviceId) {
      // Prefer device binding table if it exists (package schema)
      // - Enforce max_devices where available (fallback 3)
      const maxDevices = Number((existingLicense as any).max_devices ?? 3);

      const { data: activeDevices, error: devicesError } = await supabaseClient
        .from("dlc_license_devices")
        .select("id, device_id, is_active")
        .eq("license_id", existingLicense.id)
        .eq("is_active", true);

      // If dlc_license_devices doesn't exist in this schema, devicesError will be non-null.
      // In that case, we fall back to legacy dlc_licenses.device_id update.
      if (!devicesError) {
        const alreadyBound = (activeDevices || []).some((d: any) => d.device_id === deviceId);
        if (!alreadyBound && (activeDevices || []).length >= maxDevices) {
          return new Response(
            JSON.stringify({ error: "Maximum devices reached for this license" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const { error: upsertError } = await supabaseClient.from("dlc_license_devices").upsert(
          {
            license_id: existingLicense.id,
            device_id: deviceId,
            device_platform:
              devicePlatform === "android" || devicePlatform === "ios" || devicePlatform === "web"
                ? devicePlatform
                : "web",
            is_active: true,
            last_used_at: new Date().toISOString(),
            last_validation_at: new Date().toISOString(),
          },
          { onConflict: "license_id,device_id" },
        );

        if (upsertError) {
          console.error("Error upserting license device record:", upsertError);
        }
      } else {
        // Legacy fallback: attempt to store device_id directly on license record
        const { error: updateError } = await supabaseClient
          .from("dlc_licenses")
          .update({ device_id: deviceId, updated_at: new Date().toISOString() })
          .eq("id", existingLicense.id);
        if (updateError) {
          console.error("Error updating license device_id (legacy):", updateError);
        }
      }
    }

    // Return license information (include both schema variants)
    return new Response(
      JSON.stringify({
        valid: true,
        license: {
          id: existingLicense.id,
          userId: existingLicense.user_id,
          packageId: (existingLicense as any).package_id ?? null,
          licenseType: (existingLicense as any).license_type ?? null,
          licenseKey: existingLicense.license_key,
          purchaseDate: existingLicense.purchase_date,
          expirationDate:
            (existingLicense as any).expiration_date ??
            (existingLicense as any).subscription_end ??
            null,
          deviceId: (existingLicense as any).device_id || deviceId || null,
          contentVersion: (existingLicense as any).content_version ?? null,
          signature: (existingLicense as any).signature ?? null,
          isActive: existingLicense.is_active,
          createdAt: existingLicense.created_at,
          updatedAt: existingLicense.updated_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error verifying DLC license:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
