import { useCallback, useEffect, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PartnerSyncRetentionPolicy } from "./types";
// Note: We no longer use RPCs that don't exist in the schema

export function usePartnerRetention(connectionId: string | null) {
  const [policy, setPolicy] = useState<PartnerSyncRetentionPolicy | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId) {
      setPolicy(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await fromExtended("partner_sync_retention_policies")
        .select("*")
        .eq("connection_id", connectionId)
        .maybeSingle();
      if (error) {
        logger.error("partner sync: load retention failed", { error: error.message });
        return;
      }
      if (data) setPolicy(data as PartnerSyncRetentionPolicy);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePolicy = useCallback(
    async (patch: Partial<PartnerSyncRetentionPolicy>) => {
      if (!connectionId) return false;
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }
        const { data, error } = await fromExtended("partner_sync_retention_policies")
          .upsert(
            {
              connection_id: connectionId,
              set_by: user.id,
              retention_days_pings: patch.retention_days_pings ?? policy?.retention_days_pings ?? 180,
              retention_days_selections:
                patch.retention_days_selections ?? policy?.retention_days_selections ?? 365,
              retention_days_plans: patch.retention_days_plans ?? policy?.retention_days_plans ?? 365,
              retention_days_events:
                patch.retention_days_events ?? policy?.retention_days_events ?? 365,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "connection_id" },
          )
          .select("*")
          .single();
        if (error) {
          logger.error("partner sync: update retention failed", { error: error.message });
          toast.error("Failed to update retention");
          return false;
        }
        setPolicy(data as PartnerSyncRetentionPolicy);
        toast.success("Retention updated");
        return true;
      } finally {
        setLoading(false);
      }
    },
    [connectionId, policy],
  );

  const applyRetention = useCallback(async () => {
    if (!connectionId || !policy) return false;
    try {
      // Apply retention by deleting old records directly
      const now = new Date();
      const pingCutoff = new Date(now.getTime() - policy.retention_days_pings * 24 * 60 * 60 * 1000);
      const selectionCutoff = new Date(now.getTime() - policy.retention_days_selections * 24 * 60 * 60 * 1000);
      
      await fromExtended("partner_thought_pings")
        .delete()
        .eq("connection_id", connectionId)
        .lt("created_at", pingCutoff.toISOString());
      
      await fromExtended("partner_position_selections")
        .delete()
        .eq("connection_id", connectionId)
        .lt("created_at", selectionCutoff.toISOString());
      
      toast.success("Retention policy applied");
      return true;
    } catch (error) {
      logger.error("partner sync: apply retention failed", { error });
      toast.error("Failed to apply retention");
      return false;
    }
  }, [connectionId, policy]);

  return {
    policy,
    loading,
    reload: load,
    updatePolicy,
    applyRetention,
  };
}
