import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const PERMISSION_TYPES = ["scans", "wellness_scores", "diary_entries", "goals", "progress_photos"] as const;

export type PartnerPermissionType = (typeof PERMISSION_TYPES)[number];

export type PartnerPermissionsMap = Record<PartnerPermissionType, boolean>;

const DEFAULT_PERMISSIONS: PartnerPermissionsMap = {
  scans: false,
  wellness_scores: false,
  diary_entries: false,
  goals: false,
  progress_photos: false,
};

export function usePartnerPermissions(connectionId: string | null) {
  const [permissions, setPermissions] = useState<PartnerPermissionsMap>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId) {
      setPermissions(DEFAULT_PERMISSIONS);
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await fromExtended("partner_data_permissions")
        .select("data_type,can_view")
        .eq("connection_id", connectionId)
        .eq("user_id", user.id);

      if (error) {
        logger.error("partner sync: load permissions failed", { error: error.message });
        return;
      }

      const next: PartnerPermissionsMap = { ...DEFAULT_PERMISSIONS };
      for (const row of data || []) {
        const type = row.data_type as PartnerPermissionType;
        if (type in next) {
          next[type] = Boolean(row.can_view);
        }
      }
      setPermissions(next);
    } catch (err) {
      logger.error("partner sync: load permissions failed", { error: err });
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePermission = useCallback(
    async (type: PartnerPermissionType, canView: boolean) => {
      if (!connectionId) return false;
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }

        const { error } = await fromExtended("partner_data_permissions").upsert(
          {
            connection_id: connectionId,
            user_id: user.id,
            data_type: type,
            can_view: canView,
            can_comment: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,user_id,data_type" },
        );

        if (error) {
          logger.error("partner sync: update permission failed", { error: error.message });
          toast.error("Failed to update permissions");
          return false;
        }

        setPermissions(prev => ({ ...prev, [type]: canView }));
        return true;
      } catch (err) {
        logger.error("partner sync: update permission failed", { error: err });
        toast.error("Failed to update permissions");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [connectionId],
  );

  const availableTypes = useMemo(() => [...PERMISSION_TYPES], []);

  return {
    permissions,
    availableTypes,
    loading,
    reload: load,
    updatePermission,
  };
}
