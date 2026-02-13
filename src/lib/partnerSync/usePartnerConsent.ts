import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { PARTNER_CONSENT_VERSION } from "./constants";
import type { PartnerSyncConsentRecord } from "./types";

export function usePartnerConsent(connectionId: string | null) {
  const [consents, setConsents] = useState<PartnerSyncConsentRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId) {
      setConsents([]);
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      if (!user) return;
      const { data, error } = await fromExtended("partner_sync_consent")
        .select("*")
        .eq("connection_id", connectionId)
        .eq("consent_version", PARTNER_CONSENT_VERSION);
      if (error) {
        logger.error("partner sync: load consent failed", { error: error.message });
        return;
      }
      setConsents((data || []) as PartnerSyncConsentRecord[]);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const myConsent = useMemo(
    () => consents.find(c => c.user_id === currentUserId) ?? null,
    [consents, currentUserId],
  );

  const partnerConsent = useMemo(
    () => consents.find(c => c.user_id !== currentUserId) ?? null,
    [consents, currentUserId],
  );

  const needsConsent = useMemo(
    () => !myConsent || Boolean(myConsent.revoked_at),
    [myConsent],
  );

  const partnerNeedsConsent = useMemo(
    () => !partnerConsent || Boolean(partnerConsent.revoked_at),
    [partnerConsent],
  );

  const acceptConsent = useCallback(async () => {
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
      const { error } = await fromExtended("partner_sync_consent").upsert(
        {
          connection_id: connectionId,
          user_id: user.id,
          consent_version: PARTNER_CONSENT_VERSION,
          accepted_at: new Date().toISOString(),
          revoked_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,user_id,consent_version" },
      );
      if (error) {
        logger.error("partner sync: accept consent failed", { error: error.message });
        toast.error("Failed to accept consent");
        return false;
      }
      toast.success("Consent recorded");
      await load();
      return true;
    } finally {
      setLoading(false);
    }
  }, [connectionId, load]);

  const revokeConsent = useCallback(async () => {
    if (!connectionId || !currentUserId) return false;
    try {
      setLoading(true);
      const { error } = await fromExtended("partner_sync_consent")
        .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("connection_id", connectionId)
        .eq("user_id", currentUserId)
        .eq("consent_version", PARTNER_CONSENT_VERSION);
      if (error) {
        logger.error("partner sync: revoke consent failed", { error: error.message });
        toast.error("Failed to revoke consent");
        return false;
      }
      toast.success("Consent revoked");
      await load();
      return true;
    } finally {
      setLoading(false);
    }
  }, [connectionId, currentUserId, load]);

  return {
    consents,
    currentUserId,
    needsConsent,
    partnerNeedsConsent,
    loading,
    acceptConsent,
    revokeConsent,
    reload: load,
  };
}
