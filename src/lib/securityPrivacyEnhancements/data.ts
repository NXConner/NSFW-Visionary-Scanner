import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export async function exportUserData(): Promise<Record<string, unknown> | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [twoFA, sessions, alerts, privacy, loginHistory] = await Promise.all([
      fromExtended("two_factor_authentication").select("*").eq("user_id", user.id),
      fromExtended("active_sessions").select("*").eq("user_id", user.id),
      fromExtended("security_alerts").select("*").eq("user_id", user.id),
      fromExtended("privacy_controls").select("*").eq("user_id", user.id),
      fromExtended("login_history").select("*").eq("user_id", user.id),
    ]);

    const exportData = {
      twoFA: twoFA.data ?? [],
      sessions: sessions.data ?? [],
      alerts: alerts.data ?? [],
      privacy: privacy.data ?? [],
      loginHistory: loginHistory.data ?? [],
      exportedAt: new Date().toISOString(),
    };

    toast.success("Security data exported");
    return exportData;
  } catch (err) {
    logger.error("Error exporting user data", { error: err });
    return null;
  }
}

export async function deleteAllUserData(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Only deletes security/privacy subsystem data (does not delete the user account or other app data).
    const tables = [
      "two_factor_authentication",
      "active_sessions",
      "security_alerts",
      "privacy_controls",
      "login_history",
    ] as const;

    for (const table of tables) {
      const { error } = await fromExtended(table).delete().eq("user_id", user.id);
      if (error) {
        logger.error("Failed to delete user security data", { table, error: error.message });
        toast.error("Failed to delete data");
        return false;
      }
    }

    toast.success("Security data deleted");
    return true;
  } catch (err) {
    logger.error("Error deleting user security data", { error: err });
    toast.error("Failed to delete data");
    return false;
  }
}
