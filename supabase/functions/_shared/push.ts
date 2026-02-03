interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export type PushPlatform = "ios" | "android" | "web";

export interface PushTarget {
  token: string;
  platform: PushPlatform;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}

export function sanitizeNotificationText(input: unknown): string {
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
  payload: PushPayload,
  token: string,
): Promise<SendResult> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message: Record<string, unknown> = {
    message: {
      token,
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
  }
  return { success: false, error: responseData.error?.message || "Unknown error" };
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

async function sendAPNSNotification(payload: PushPayload, token: string): Promise<SendResult> {
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  if (!bundleId) {
    throw new Error("APNs not configured (APNS_BUNDLE_ID required)");
  }

  const useSandbox = (Deno.env.get("APNS_USE_SANDBOX") ?? "false").toLowerCase() === "true";
  const host = useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const url = `${host}/3/device/${token}`;

  const jwt = await getApnsJwt();

  const body: Record<string, unknown> = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
    },
  };

  if (payload.data) {
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

export async function sendPushToTargets(
  targets: PushTarget[],
  payload: PushPayload,
): Promise<{ success: number; failed: number; results: SendResult[] }> {
  if (!targets.length) {
    return { success: 0, failed: 0, results: [] };
  }

  const safeTitle = sanitizeNotificationText(payload.title);
  const safeBody = sanitizeNotificationText(payload.body);
  if (!safeTitle || !safeBody) {
    throw new Error("Title and body are required");
  }

  const hasFcmTargets = targets.some(t => t.platform !== "ios");
  const serviceAccountJson = hasFcmTargets ? Deno.env.get("FIREBASE_SERVICE_ACCOUNT") : null;

  let accessToken: string | null = null;
  let projectId: string | null = null;
  if (hasFcmTargets) {
    if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    const serviceAccount = JSON.parse(serviceAccountJson) as FirebaseServiceAccount;
    projectId = serviceAccount.project_id;
    accessToken = await getAccessToken(serviceAccount);
  }

  const results: SendResult[] = [];
  for (const target of targets) {
    if (target.platform === "ios") {
      results.push(await sendAPNSNotification({ ...payload, title: safeTitle, body: safeBody }, target.token));
    } else {
      results.push(
        await sendFCMNotification(
          accessToken as string,
          projectId as string,
          { ...payload, title: safeTitle, body: safeBody },
          target.token,
        ),
      );
    }
  }

  const success = results.filter(r => r.success).length;
  const failed = results.length - success;
  return { success, failed, results };
}
