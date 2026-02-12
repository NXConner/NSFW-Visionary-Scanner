import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

// ============================================
// Pre-configured Partner Pairs
// ============================================

interface PartnerPair {
  email1: string;
  email2: string;
}

/**
 * Get pre-configured partner pairs from environment variables
 * Also includes hardcoded fallback for n8ter8@gmail.com and slkchick_360@yahoo.com
 */
function getPreConfiguredPartnerPairs(): PartnerPair[] {
  const pairs: PartnerPair[] = [];

  // Primary partner pair from environment
  const email1 = import.meta.env.VITE_PARTNER_PAIR_EMAIL_1;
  const email2 = import.meta.env.VITE_PARTNER_PAIR_EMAIL_2;

  if (email1 && email2) {
    pairs.push({
      email1: email1.toLowerCase().trim(),
      email2: email2.toLowerCase().trim(),
    });
  }

  // Hardcoded fallback pair - always ensure this pair is connected
  const hardcodedPair: PartnerPair = {
    email1: "n8ter8@gmail.com",
    email2: "slkchick_360@yahoo.com",
  };

  // Add hardcoded pair if not already present
  const hasHardcoded = pairs.some(
    p =>
      (p.email1 === hardcodedPair.email1 && p.email2 === hardcodedPair.email2) ||
      (p.email1 === hardcodedPair.email2 && p.email2 === hardcodedPair.email1),
  );

  if (!hasHardcoded) {
    pairs.push(hardcodedPair);
  }

  return pairs;
}

/**
 * Get the partner email for a given user email from pre-configured pairs
 */
function getPartnerEmailFromPair(userEmail: string): string | null {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const pairs = getPreConfiguredPartnerPairs();

  for (const pair of pairs) {
    if (pair.email1 === normalizedEmail) return pair.email2;
    if (pair.email2 === normalizedEmail) return pair.email1;
  }

  return null;
}

export function usePartnerConnection() {
  const [connections, setConnections] = useState<PartnerConnection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoConnectAttempted = useRef(false);

  /**
   * Auto-connect with pre-configured partner if the current user is part of a pair
   * This creates a database record for the partner connection
   */
  const autoConnectPreConfiguredPartner = useCallback(async (userId: string, userEmail: string) => {
    const partnerEmail = getPartnerEmailFromPair(userEmail);
    if (!partnerEmail) {
      logger.info("[partnerSync] User not part of a pre-configured pair", { userEmail });
      return;
    }

    logger.info("[partnerSync] User is part of pre-configured pair", {
      userEmail,
      partnerEmail,
    });

    try {
      // Look up partner's user ID by email from profiles table
      const { data: partnerProfile } = await fromExtended("profiles")
        .select("user_id")
        .eq("email", partnerEmail)
        .maybeSingle();

      let partnerUserId: string | null = null;

      if (partnerProfile?.user_id) {
        partnerUserId = partnerProfile.user_id;
        logger.info("[partnerSync] Found partner profile", {
          partnerEmail,
          partnerUserId,
        });
      } else {
        // If no profile found, the partner may not have signed up yet
        // Can't create connection without partner_id (DB requires it)
        logger.info(
          "[partnerSync] Partner profile not found yet - will connect when partner signs up",
          {
            partnerEmail,
          },
        );
        return;
      }

      // Check if connection already exists (in either direction)
      const { data: existingConnections } = await fromExtended("partner_connections")
        .select("id,status,user_id,partner_id")
        .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
        .or(`user_id.eq.${partnerUserId},partner_id.eq.${partnerUserId}`);

      const existing = (existingConnections || []).find(
        c =>
          (c.user_id === userId && c.partner_id === partnerUserId) ||
          (c.user_id === partnerUserId && c.partner_id === userId),
      );

      if (existing) {
        logger.info("[partnerSync] Connection already exists", {
          connectionId: existing.id,
          status: existing.status,
        });
        return;
      }

      // Create auto-connection with accepted status
      const now = new Date().toISOString();

      const { data: newConnection, error: insertError } = await fromExtended("partner_connections")
        .insert({
          user_id: userId,
          partner_id: partnerUserId,
          status: "accepted",
          accepted_at: now,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (insertError) {
        // Might fail due to unique constraint - that's okay, means connection exists
        logger.info("[partnerSync] Auto-connect insert failed (may already exist)", {
          error: insertError.message,
        });
        return;
      }

      logger.info("[partnerSync] Auto-connected with pre-configured partner!", {
        connectionId: newConnection?.id,
        partnerEmail,
        partnerUserId,
      });

      toast.success(`Connected with ${partnerEmail}!`);
    } catch (err) {
      logger.error("[partnerSync] Auto-connect failed", { error: err });
    }
  }, []);

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

      // Auto-connect on first load if user is part of a pre-configured pair
      if (!autoConnectAttempted.current && user.email) {
        autoConnectAttempted.current = true;
        await autoConnectPreConfiguredPartner(user.id, user.email);
      }

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
  }, [autoConnectPreConfiguredPartner]);

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
