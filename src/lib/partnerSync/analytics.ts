import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export async function logPartnerEvent(
  connectionId: string,
  actorId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await fromExtended("partner_sync_events").insert({
      connection_id: connectionId,
      actor_id: actorId,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn("partner sync: failed to log event", { error, eventType, connectionId });
  }
}
