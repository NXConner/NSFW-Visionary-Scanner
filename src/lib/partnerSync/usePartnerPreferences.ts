import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PartnerSyncPreferences } from "./types";
import { withRetry } from "./retry";

const DEFAULT_PREFS: Omit<PartnerSyncPreferences, "user_id" | "created_at" | "updated_at"> = {
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  timezone: "UTC",
  rate_limit_per_hour: 12,
  allow_push_notifications: true,
  allow_scheduled_pings: true,
  allow_media: true,
};

export function usePartnerPreferences() {
  const [preferences, setPreferences] = useState<PartnerSyncPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await fromExtended("partner_sync_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        logger.error("partner sync: load preferences failed", { error: error.message });
        return;
      }

      if (!data) {
        const { data: created, error: createError } = await fromExtended(
          "partner_sync_preferences",
        )
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (createError) {
          logger.error("partner sync: create preferences failed", {
            error: createError.message,
          });
          return;
        }
        setPreferences(created as PartnerSyncPreferences);
      } else {
        setPreferences(data as PartnerSyncPreferences);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePreferences = useCallback(
    async (patch: Partial<PartnerSyncPreferences>) => {
      if (!preferences) return false;
      setLoading(true);
      try {
        await withRetry(async () => {
          const { error } = await fromExtended("partner_sync_preferences")
            .update({
              ...patch,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", preferences.user_id);
          if (error) throw error;
        });
        setPreferences(prev => (prev ? { ...prev, ...patch } : prev));
        toast.success("Preferences updated");
        return true;
      } catch (error) {
        logger.error("partner sync: update preferences failed", { error });
        toast.error("Failed to update preferences");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [preferences],
  );

  return {
    preferences,
    loading,
    reload: load,
    updatePreferences,
  };
}
