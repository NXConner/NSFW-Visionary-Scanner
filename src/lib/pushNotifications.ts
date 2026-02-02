/**
 * Push Notification Utilities
 *
 * Backed by `supabase/migrations/20251205000000_device_tokens.sql` + edge functions:
 * - `register-device-token` (upserts `device_tokens`)
 * - `send-push-notification` (FCM send)
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import { Capacitor } from "@capacitor/core";

export interface DeviceTokenRegistration {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}

/**
 * Register a device token with the backend
 */
export async function registerDeviceToken(registration: DeviceTokenRegistration): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("register-device-token", {
      body: registration,
    });

    if (error) {
      logger.error("Failed to register device token", { error: error.message, registration });
      return false;
    }

    logger.info("Device token registered", {
      token: registration.token,
      platform: registration.platform,
    });
    return true;
  } catch (error) {
    logger.error("Error registering device token", {
      error: error instanceof Error ? error.message : "Unknown error",
      registration,
    });
    return false;
  }
}

/**
 * Get the current platform
 */
export function getPlatform(): "ios" | "android" | "web" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  opts?: { imageUrl?: string },
): Promise<boolean> {
  try {
    // Resolve device tokens for the target user
    const { data: rows, error: tokenErr } = await supabase
      // Supabase types are generated; keep resilient for schema changes.

      .from("device_tokens" as any)
      .select("token")
      .eq("user_id", userId);

    if (tokenErr) {
      logger.error("Failed to load device tokens", { error: tokenErr.message, userId });
      return false;
    }

    const tokens = ((rows ?? []) as any[]).map(r => r.token).filter(Boolean);
    if (tokens.length === 0) {
      logger.info("No device tokens found; skipping push", { userId, title });
      return true;
    }

    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        tokens,
        title,
        body,
        data,
        imageUrl: opts?.imageUrl,
      },
    });

    if (error) {
      logger.error("Failed to send push notification", { error: error.message, userId });
      return false;
    }

    logger.info("Push notification sent", { userId, title });
    return true;
  } catch (error) {
    logger.error("Error sending push notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    return false;
  }
}

/**
 * Send a push notification to multiple users
 */
export async function sendBulkPushNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  opts?: { imageUrl?: string },
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const success = await sendPushNotification(userId, title, body, data, opts);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Remove a device token (e.g., on logout)
 */
export async function removeDeviceToken(token: string): Promise<boolean> {
  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    if (!auth.user) {
      logger.info("Device token removal requested while signed out", { token });
      return true;
    }

    const { error } = await supabase

      .from("device_tokens" as any)
      .delete()
      .eq("user_id", auth.user.id)
      .eq("token", token);

    if (error) {
      logger.error("Failed to remove device token", { error: error.message, token });
      return false;
    }

    logger.info("Device token removed", { token });
    return true;
  } catch (error) {
    logger.error("Error removing device token", {
      error: error instanceof Error ? error.message : "Unknown error",
      token,
    });
    return false;
  }
}
