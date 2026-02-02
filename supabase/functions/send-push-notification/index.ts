import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationPayload {
  token: string;
  platform?: "ios" | "android" | "web";
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface APNSResponse {
  success: boolean;
  status?: number;
  error?: string;
}

interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function sanitizeNotificationText(input: unknown): string {
  const s = typeof input === "string" ? input : input == null ? "" : String(input);
  return s
    .replace(/\b(nsfw|explicit|porn|sexual|sex|adult(-only)?|18\+)\b/gi, "private")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function getAccessToken(serviceAccount: FirebaseServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKey = serviceAccount.private_key;
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput),
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  payload: PushNotificationPayload,
): Promise<FCMResponse> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message: Record<string, unknown> = {
    message: {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: {
        notification: {
          icon: "ic_stat_icon",
          color: "#0EA5E9",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    },
  };

  if (payload.data) {
    (message.message as Record<string, unknown>).data = payload.data;
  }

  if (payload.imageUrl) {
    const m = message.message as Record<string, unknown>;
    const notif = (m.notification as Record<string, unknown>) ?? {};
    notif.image = payload.imageUrl;
    m.notification = notif;
    const android = (m.android as Record<string, unknown>) ?? {};
    const androidNotif = (android.notification as Record<string, unknown>) ?? {};
    androidNotif.image = payload.imageUrl;
    android.notification = androidNotif;
    m.android = android;
    const apns = (m.apns as Record<string, unknown>) ?? {};
    apns.fcm_options = { image: payload.imageUrl };
    m.apns = apns;
  }

  const response = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const responseData = await response.json();

  if (response.ok) {
    return { success: true, messageId: responseData.name };
  } else {
    return { success: false, error: responseData.error?.message || "Unknown error" };
  }
}

async function getApnsJwt(): Promise<string> {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const p8 = Deno.env.get("APNS_KEY_P8");

  if (!keyId || !teamId || !p8) {
    throw new Error("APNs not configured (APNS_KEY_ID/APNS_TEAM_ID/APNS_KEY_P8 required)");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = { iss: teamId, iat: now };

  const enc = (v: unknown) =>
    btoa(JSON.stringify(v)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${enc(header)}.${enc(payload)}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = p8.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${sigB64}`;
}

async function sendAPNSNotification(payload: PushNotificationPayload): Promise<APNSResponse> {
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  if (!bundleId) {
    throw new Error("APNs not configured (APNS_BUNDLE_ID required)");
  }

  const useSandbox = (Deno.env.get("APNS_USE_SANDBOX") ?? "false").toLowerCase() === "true";
  const host = useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const url = `${host}/3/device/${payload.token}`;

  const jwt = await getApnsJwt();

  const body: Record<string, unknown> = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
    },
  };

  if (payload.data) {
    // Attach custom keys at top-level to avoid conflicts with aps.
    for (const [k, v] of Object.entries(payload.data)) body[k] = v;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.ok) return { success: true, status: resp.status };

  const errText = await resp.text().catch(() => "");
  return { success: false, status: resp.status, error: errText || `APNs error ${resp.status}` };
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Push notification request missing Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Push notification auth error:", authError?.message || "Invalid token");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if user has admin role (required for sending push notifications)
    const { data: roles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError.message);
    }

    const isAdmin = (roles || []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "super_admin",
    );

    if (!isAdmin) {
      console.error(`User ${user.id} attempted to send push notification without admin role`);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Admin user ${user.id} sending push notification`);

    const { tokens, targets, title, body, data, imageUrl } = await req.json();

    const resolvedTargets: Array<{ token: string; platform: "ios" | "android" | "web" }> = [];

    if (Array.isArray(targets) && targets.length > 0) {
      for (const t of targets as Array<{ token?: unknown; platform?: unknown }>) {
        if (typeof t?.token !== "string" || !t.token) continue;
        const platform =
          t.platform === "ios" || t.platform === "android" || t.platform === "web"
            ? t.platform
            : "android";
        resolvedTargets.push({ token: t.token, platform });
      }
    } else if (Array.isArray(tokens) && tokens.length > 0) {
      for (const token of tokens as unknown[]) {
        if (typeof token === "string" && token)
          resolvedTargets.push({ token, platform: "android" });
      }
    }

    if (resolvedTargets.length === 0) throw new Error("No device tokens provided");

    const safeTitle = sanitizeNotificationText(title);
    const safeBody = sanitizeNotificationText(body);

    if (!safeTitle || !safeBody) {
      throw new Error("Title and body are required");
    }

    const hasFcmTargets = resolvedTargets.some(t => t.platform !== "ios");
    const serviceAccountJson = hasFcmTargets ? Deno.env.get("FIREBASE_SERVICE_ACCOUNT") : null;

    let accessToken: string | null = null;
    let projectId: string | null = null;
    if (hasFcmTargets) {
      if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
      const serviceAccount = JSON.parse(serviceAccountJson) as FirebaseServiceAccount;
      projectId = serviceAccount.project_id;
      accessToken = await getAccessToken(serviceAccount);
    }

    const results = await Promise.all(
      resolvedTargets.map(t => {
        if (t.platform === "ios") {
          return sendAPNSNotification({
            token: t.token,
            platform: "ios",
            title: safeTitle,
            body: safeBody,
            data,
            imageUrl,
          });
        }
        return sendFCMNotification(accessToken as string, projectId as string, {
          token: t.token,
          platform: t.platform,
          title: safeTitle,
          body: safeBody,
          data,
          imageUrl,
        });
      }),
    );

    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    const failureCount = results.filter((r: { success: boolean }) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Push notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
