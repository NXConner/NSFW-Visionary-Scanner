import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  token: string;
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

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const privateKey = serviceAccount.private_key;
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  const jwt = `${signatureInput}.${signatureB64}`;
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  payload: PushNotificationPayload
): Promise<FCMResponse> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  
  const message: any = {
    message: {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: {
        notification: {
          icon: 'ic_stat_icon',
          color: '#0EA5E9',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };
  
  if (payload.data) {
    message.message.data = payload.data;
  }
  
  if (payload.imageUrl) {
    message.message.notification.image = payload.imageUrl;
    message.message.android.notification.image = payload.imageUrl;
    message.message.apns.fcm_options = { image: payload.imageUrl };
  }
  
  const response = await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  
  const responseData = await response.json();
  
  if (response.ok) {
    return { success: true, messageId: responseData.name };
  } else {
    return { success: false, error: responseData.error?.message || 'Unknown error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    const { tokens, title, body, data, imageUrl } = await req.json();

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('No device tokens provided');
    }

    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    // Send to all tokens
    const results = await Promise.all(
      tokens.map(token =>
        sendFCMNotification(accessToken, projectId, {
          token,
          title,
          body,
          data,
          imageUrl,
        })
      )
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Push notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
