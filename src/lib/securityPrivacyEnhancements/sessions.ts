import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { ActiveSession } from "./types";
import { sha256Hex } from "./crypto";

type ActiveSessionRow = {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_name: string | null;
  device_type: string | null;
  platform: string | null;
  browser: string | null;
  ip_address: string | null;
  location_city: string | null;
  location_country: string | null;
  is_active: boolean | null;
  is_current_session: boolean | null;
  last_activity_at: string;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

function mapSession(row: ActiveSessionRow): ActiveSession {
  return {
    id: row.id,
    user_id: row.user_id,
    session_token_hash: row.session_token_hash,
    device_name: row.device_name,
    device_type: row.device_type,
    platform: row.platform,
    browser: row.browser,
    ip_address: row.ip_address,
    location_city: row.location_city,
    location_country: row.location_country,
    is_active: Boolean(row.is_active),
    is_current_session: Boolean(row.is_current_session),
    last_activity_at: row.last_activity_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
    revoked_at: row.revoked_at,
  };
}

async function upsertCurrentSession(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session?.access_token || !session?.user) return;

    const hash = await sha256Hex(session.access_token);
    const now = new Date().toISOString();

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const deviceName = ua ? ua.slice(0, 80) : null;

    await fromExtended("active_sessions").upsert(
      {
        user_id: session.user.id,
        session_token_hash: hash,
        device_name: deviceName,
        device_type: null,
        platform: null,
        browser: null,
        is_active: true,
        is_current_session: true,
        last_activity_at: now,
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      },
      { onConflict: "session_token_hash" },
    );
  } catch (err) {
    logger.error("Failed to upsert current session", { error: err });
  }
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    await upsertCurrentSession();

    const { data, error } = await fromExtended("active_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_activity_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to get active sessions", { error: error.message });
      return [];
    }
    return ((data || []) as ActiveSessionRow[]).map(mapSession);
  } catch (err) {
    logger.error("Error getting active sessions", { error: err });
    return [];
  }
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await fromExtended("active_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Failed to revoke session", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Error revoking session", { error: err });
    return false;
  }
}

export async function revokeAllOtherSessions(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await fromExtended("active_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_current_session", false);

    if (error) {
      logger.error("Failed to revoke other sessions", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Error revoking other sessions", { error: err });
    return false;
  }
}
