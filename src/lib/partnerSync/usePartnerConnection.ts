import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PartnerConnection } from "./types";
import { generateInviteCode } from "./utils";

type InviteInput = {
  partnerId: string;
  expiresInDays?: number;
};

export function usePartnerConnection() {
  const [connections, setConnections] = useState<PartnerConnection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setConnections([]);
        setCurrentUserId(null);
        return;
      }
      setCurrentUserId(user.id);

      const { data, error: queryError } = await fromExtended("partner_connections")
        .select("*")
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (queryError) {
        setError("Failed to load connections");
        logger.error("partner sync: load connections failed", { error: queryError.message });
        return;
      }
      setConnections((data || []) as PartnerConnection[]);
    } catch (err) {
      setError("Failed to load connections");
      logger.error("partner sync: load connections failed", { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const activeConnection = useMemo(
    () => connections.find(c => c.status === "accepted") ?? null,
    [connections],
  );

  const pendingIncoming = useMemo(() => {
    if (!currentUserId) return [];
    return connections.filter(c => c.status === "pending" && c.partner_id === currentUserId);
  }, [connections, currentUserId]);

  const pendingOutgoing = useMemo(() => {
    if (!currentUserId) return [];
    return connections.filter(c => c.status === "pending" && c.user_id === currentUserId);
  }, [connections, currentUserId]);

  const sendInvite = useCallback(
    async ({ partnerId, expiresInDays = 7 }: InviteInput) => {
      if (!currentUserId) {
        toast.error("Please sign in to invite a partner");
        return null;
      }
      if (!partnerId.trim()) {
        toast.error("Partner user id is required");
        return null;
      }
      if (partnerId.trim() === currentUserId) {
        toast.error("You cannot invite yourself");
        return null;
      }

      const existing = connections.find(
        c =>
          (c.user_id === currentUserId && c.partner_id === partnerId.trim()) ||
          (c.user_id === partnerId.trim() && c.partner_id === currentUserId),
      );
      if (existing?.status === "accepted") {
        toast.error("You are already connected");
        return null;
      }

      const inviteCode = generateInviteCode();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      try {
        setLoading(true);
        const { data, error: upsertError } = await fromExtended("partner_connections")
          .upsert(
            {
              user_id: currentUserId,
              partner_id: partnerId.trim(),
              status: "pending",
              invitation_code: inviteCode,
              invitation_expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,partner_id" },
          )
          .select("*")
          .single();

        if (upsertError) {
          logger.error("partner sync: invite failed", { error: upsertError.message });
          toast.error("Failed to create invite");
          return null;
        }

        setLastInviteCode(inviteCode);
        setConnections(prev => {
          const next = prev.filter(c => c.id !== data.id);
          return [data as PartnerConnection, ...next];
        });
        toast.success("Invite created");
        return data as PartnerConnection;
      } catch (err) {
        logger.error("partner sync: invite failed", { error: err });
        toast.error("Failed to create invite");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [connections, currentUserId],
  );

  const acceptInviteByCode = useCallback(
    async (inviteCode: string) => {
      if (!inviteCode.trim()) {
        toast.error("Invite code required");
        return false;
      }
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }

        const { data, error: findError } = await fromExtended("partner_connections")
          .select("*")
          .eq("invitation_code", inviteCode.trim())
          .eq("partner_id", user.id)
          .maybeSingle();

        if (findError || !data) {
          toast.error("Invite not found");
          return false;
        }

        if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) {
          toast.error("Invite expired");
          return false;
        }

        const { error: updateError } = await fromExtended("partner_connections")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            invitation_code: null,
            invitation_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (updateError) {
          logger.error("partner sync: accept invite failed", { error: updateError.message });
          toast.error("Failed to accept invite");
          return false;
        }

        toast.success("Partner connected");
        await loadConnections();
        return true;
      } catch (err) {
        logger.error("partner sync: accept invite failed", { error: err });
        toast.error("Failed to accept invite");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadConnections],
  );

  const acceptConnection = useCallback(
    async (connectionId: string) => {
      try {
        setLoading(true);
        const { error: updateError } = await fromExtended("partner_connections")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            invitation_code: null,
            invitation_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connectionId);
        if (updateError) {
          logger.error("partner sync: accept connection failed", { error: updateError.message });
          toast.error("Failed to accept");
          return false;
        }
        toast.success("Partner connected");
        await loadConnections();
        return true;
      } catch (err) {
        logger.error("partner sync: accept connection failed", { error: err });
        toast.error("Failed to accept");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadConnections],
  );

  const declineConnection = useCallback(
    async (connectionId: string) => {
      try {
        setLoading(true);
        const { error: updateError } = await fromExtended("partner_connections")
          .update({ status: "declined", updated_at: new Date().toISOString() })
          .eq("id", connectionId);
        if (updateError) {
          logger.error("partner sync: decline failed", { error: updateError.message });
          toast.error("Failed to decline");
          return false;
        }
        toast.success("Invite declined");
        await loadConnections();
        return true;
      } catch (err) {
        logger.error("partner sync: decline failed", { error: err });
        toast.error("Failed to decline");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadConnections],
  );

  const disconnect = useCallback(
    async (connectionId: string) => {
      try {
        setLoading(true);
        const { error: updateError } = await fromExtended("partner_connections")
          .update({ status: "declined", updated_at: new Date().toISOString() })
          .eq("id", connectionId);
        if (updateError) {
          logger.error("partner sync: disconnect failed", { error: updateError.message });
          toast.error("Failed to disconnect");
          return false;
        }
        toast.success("Disconnected");
        await loadConnections();
        return true;
      } catch (err) {
        logger.error("partner sync: disconnect failed", { error: err });
        toast.error("Failed to disconnect");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadConnections],
  );

  return {
    connections,
    currentUserId,
    activeConnection,
    pendingIncoming,
    pendingOutgoing,
    loading,
    error,
    lastInviteCode,
    reload: loadConnections,
    sendInvite,
    acceptInviteByCode,
    acceptConnection,
    declineConnection,
    disconnect,
  };
}
