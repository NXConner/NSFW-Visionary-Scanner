import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { JsonObject, SecurityAlert } from "./types";

type SecurityAlertRow = {
  id: string;
  user_id: string;
  alert_type: SecurityAlert["alert_type"];
  alert_severity: SecurityAlert["alert_severity"];
  alert_title: string;
  alert_message: string;
  action_data: JsonObject | null;
  is_read: boolean | null;
  created_at: string;
};

function mapAlert(row: SecurityAlertRow): SecurityAlert {
  return {
    id: row.id,
    user_id: row.user_id,
    alert_type: row.alert_type,
    alert_severity: row.alert_severity,
    alert_title: row.alert_title,
    alert_message: row.alert_message,
    details: row.action_data ?? null,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
  };
}

export async function createSecurityAlert(
  _userId: string,
  alertType: SecurityAlert["alert_type"],
  alertSeverity: SecurityAlert["alert_severity"],
  alertTitle: string,
  alertMessage: string,
  details?: JsonObject,
): Promise<SecurityAlert | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("security_alerts")
      .insert({
        user_id: user.id,
        alert_type: alertType,
        alert_severity: alertSeverity,
        alert_title: alertTitle,
        alert_message: alertMessage,
        action_data: details ?? null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to create security alert", { error: error.message });
      return null;
    }

    return mapAlert(data as SecurityAlertRow);
  } catch (err) {
    logger.error("Error creating security alert", { error: err });
    return null;
  }
}

export async function getSecurityAlerts(unreadOnly: boolean = false): Promise<SecurityAlert[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = fromExtended("security_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get security alerts", { error: error.message });
      return [];
    }

    return ((data || []) as SecurityAlertRow[]).map(mapAlert);
  } catch (err) {
    logger.error("Error getting security alerts", { error: err });
    return [];
  }
}

export async function markAlertAsRead(alertId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await fromExtended("security_alerts")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Failed to mark alert as read", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Error marking alert as read", { error: err });
    return false;
  }
}
