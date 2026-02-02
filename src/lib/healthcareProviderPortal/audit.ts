import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export async function logHIPAAAudit(
  userId: string,
  providerId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  description: string,
): Promise<void> {
  try {
    await supabase.from("hipaa_audit_logs").insert({
      user_id: userId,
      provider_id: providerId,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
    });
  } catch (err) {
    logger.error("Failed to log HIPAA audit", { error: err });
  }
}
