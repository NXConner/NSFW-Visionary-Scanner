import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { HIPAAAuditLog } from "./types";

export async function getHIPAAAuditLogs(
  startDate?: string,
  endDate?: string,
): Promise<HIPAAAuditLog[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("hipaa_audit_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get audit logs", { error: error.message });
      return [];
    }

    return (data || []) as HIPAAAuditLog[];
  } catch (err) {
    logger.error("Error getting audit logs", { error: err });
    return [];
  }
}
