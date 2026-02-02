import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { sendPushNotification } from "@/lib/pushNotifications";
import { decryptData, encryptData } from "@/lib/encryption";
import { subscribeToTable } from "./realtime";
import { withRetry } from "./retry";
import { createTraceId } from "./trace";
import type {
  PartnerThoughtPing,
  ThoughtPingDeliveryState,
  ThoughtPingIntensity,
  ThoughtPingPriority,
} from "./types";

type SendPingInput = {
  recipientId: string;
  message: string;
  detailedMessage?: string;
  toneTags: string[];
  intensity: ThoughtPingIntensity;
  priority?: ThoughtPingPriority;
  isPinned?: boolean;
  theme?: string;
  scheduledAt?: string;
  remindAt?: string;
  images?: string[];
  gifs?: string[];
  voiceMessageUrl?: string;
  readReceiptRequested?: boolean;
  privateNote?: string;
};

type ReactionMap = Record<string, Record<string, number>>;

export function useThoughtPings(connectionId: string | null, pageSize: number = 20) {
  const [pings, setPings] = useState<PartnerThoughtPing[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [reactions, setReactions] = useState<ReactionMap>({});
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setPage(0);
  }, [connectionId]);

  const load = useCallback(async () => {
    if (!connectionId) {
      setPings([]);
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      if (!user) return;

      const { data, error } = await fromExtended("partner_thought_pings")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: false })
        .range(0, pageSize * (page + 1) - 1);

      if (error) {
        logger.error("partner sync: load thought pings failed", { error: error.message });
        return;
      }

      setPings((data || []) as PartnerThoughtPing[]);
    } catch (err) {
      logger.error("partner sync: load thought pings failed", { error: err });
    } finally {
      setLoading(false);
    }
  }, [connectionId, page, pageSize]);

  const loadReactions = useCallback(async () => {
    if (!connectionId) {
      setReactions({});
      return;
    }
    if (pings.length === 0) {
      setReactions({});
      return;
    }
    const { data, error } = await fromExtended("partner_thought_ping_reactions")
      .select("ping_id,emoji")
      .in(
        "ping_id",
        pings.map(p => p.id),
      );
    if (error) {
      logger.error("partner sync: load reactions failed", { error: error.message });
      return;
    }
    const map: ReactionMap = {};
    for (const row of data || []) {
      const pingId = row.ping_id as string;
      const emoji = row.emoji as string;
      if (!map[pingId]) map[pingId] = {};
      map[pingId][emoji] = (map[pingId][emoji] ?? 0) + 1;
    }
    setReactions(map);
  }, [connectionId, pings]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    const run = async () => {
      const next: Record<string, string> = {};
      for (const ping of pings) {
        if (ping.private_note_encrypted && ping.sender_id === currentUserId) {
          const decrypted = await decryptData(ping.private_note_encrypted);
          if (decrypted) next[ping.id] = decrypted;
        }
      }
      setPrivateNotes(next);
    };
    void run();
  }, [currentUserId, pings]);

  useEffect(() => {
    if (!connectionId) return;
    const unsubscribe = subscribeToTable({
      table: "partner_thought_pings",
      filter: `connection_id=eq.${connectionId}`,
      onChange: () => void load(),
    });
    const unsubscribeReactions =
      pings.length > 0
        ? subscribeToTable({
            table: "partner_thought_ping_reactions",
            filter: `ping_id=in.(${pings.map(p => p.id).join(",")})`,
            onChange: () => void loadReactions(),
          })
        : () => {};
    return () => {
      unsubscribe();
      unsubscribeReactions();
    };
  }, [connectionId, load, loadReactions, pings]);

  const loadMore = () => setPage(prev => prev + 1);

  const dispatchScheduled = useCallback(async () => {
    if (!currentUserId) return;
    const due = pings.filter(
      ping =>
        ping.sender_id === currentUserId &&
        ping.status === "scheduled" &&
        ping.scheduled_at &&
        new Date(ping.scheduled_at).getTime() <= Date.now(),
    );
    if (due.length === 0) return;
    for (const ping of due) {
      await fromExtended("partner_thought_pings")
        .update({
          status: "sent",
          delivery_state: "queued" as ThoughtPingDeliveryState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ping.id);
    }
    await load();
  }, [currentUserId, load, pings]);

  useEffect(() => {
    void dispatchScheduled();
  }, [dispatchScheduled]);

  const dispatchReminders = useCallback(async () => {
    if (!currentUserId) return;
    const due = pings.filter(
      ping =>
        ping.sender_id === currentUserId &&
        ping.remind_at &&
        new Date(ping.remind_at).getTime() <= Date.now(),
    );
    if (due.length === 0) return;
    for (const ping of due) {
      await sendPushNotification(
        currentUserId,
        "Reminder",
        `Follow up on: ${ping.message}`,
        { pingId: ping.id },
      );
      await fromExtended("partner_thought_pings")
        .update({ remind_at: null, updated_at: new Date().toISOString() })
        .eq("id", ping.id);
    }
    await load();
  }, [currentUserId, load, pings]);

  useEffect(() => {
    void dispatchReminders();
  }, [dispatchReminders]);

  const sendPing = useCallback(
    async (input: SendPingInput) => {
      if (!connectionId) {
        toast.error("Connect with a partner first");
        return false;
      }
      if (!input.message.trim()) {
        toast.error("Message is required");
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

        const traceId = createTraceId("ping");
        const privateNoteEncrypted = input.privateNote
          ? await encryptData(input.privateNote)
          : null;
        const optimistic: PartnerThoughtPing = {
          id: `temp-${Date.now()}`,
          connection_id: connectionId,
          sender_id: user.id,
          recipient_id: input.recipientId,
          tone_tags: input.toneTags,
          intensity: input.intensity,
          theme: input.theme ?? null,
          priority: input.priority ?? "normal",
          is_pinned: input.isPinned ?? false,
          delivery_state: "queued",
          scheduled_at: input.scheduledAt ?? null,
          remind_at: input.remindAt ?? null,
          read_receipt_requested: input.readReceiptRequested ?? true,
          private_note_encrypted: privateNoteEncrypted,
          images_urls: input.images ?? null,
          gifs_urls: input.gifs ?? null,
          voice_message_url: input.voiceMessageUrl ?? null,
          quick_reply_used: null,
          reaction_summary: null,
          message: input.message,
          detailed_message: input.detailedMessage ?? null,
          status: input.scheduledAt ? "scheduled" : "sent",
          response_message: null,
          responded_at: null,
          read_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPings(prev => [optimistic, ...prev]);

        // Insert directly since RPC may not exist yet
        const result = await withRetry(() =>
          fromExtended("partner_thought_pings").insert({
            connection_id: connectionId,
            sender_id: user.id,
            recipient_id: input.recipientId,
            message: input.message,
            detailed_message: input.detailedMessage ?? null,
            tone_tags: input.toneTags,
            intensity: input.intensity,
            theme: input.theme ?? null,
            priority: input.priority ?? "normal",
            is_pinned: input.isPinned ?? false,
            read_receipt_requested: input.readReceiptRequested ?? true,
            private_note_encrypted: privateNoteEncrypted,
            scheduled_at: input.scheduledAt ?? null,
            remind_at: input.remindAt ?? null,
            images_urls: input.images ?? null,
            gifs_urls: input.gifs ?? null,
            voice_message_url: input.voiceMessageUrl ?? null,
            status: input.scheduledAt ? "scheduled" : "sent",
            delivery_state: "queued",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).select("*").single(),
        );

        const insertResult = result as { data?: PartnerThoughtPing; error?: { message: string } };
        if (insertResult.error) {
          logger.error("partner sync: send thought ping failed", { error: insertResult.error.message });
          toast.error(insertResult.error.message || "Failed to send ping");
          await load();
          return false;
        }

        const created = insertResult.data;
        if (created && created.status === "sent") {
          const pushOk = await sendPushNotification(
            input.recipientId,
            "New thought ping",
            input.message,
            { connectionId, traceId },
          );
          if (!pushOk) {
            await fromExtended("partner_thought_pings")
              .update({
                delivery_state: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", created.id);
          }
        }
        await load();
        toast.success("Ping sent");
        return true;
      } catch (err) {
        logger.error("partner sync: send thought ping failed", { error: err });
        toast.error("Failed to send ping");
        await load();
        return false;
      } finally {
        setLoading(false);
      }
    },
    [connectionId, load],
  );

  const markRead = useCallback(
    async (pingId: string) => {
      try {
        setLoading(true);
        const { error } = await fromExtended("partner_thought_pings")
          .update({
            status: "read",
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", pingId);
        if (error) {
          logger.error("partner sync: mark read failed", { error: error.message });
          toast.error("Failed to mark read");
          return false;
        }
        const ping = pings.find(item => item.id === pingId);
        if (ping?.read_receipt_requested) {
          const traceId = createTraceId("ping-read");
          await sendPushNotification(ping.sender_id, "Ping read", ping.message, {
            pingId,
            traceId,
          });
        }
        await load();
        return true;
      } catch (err) {
        logger.error("partner sync: mark read failed", { error: err });
        toast.error("Failed to mark read");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load, pings],
  );

  const respond = useCallback(
    async (pingId: string, responseMessage: string, quickReply?: string) => {
      if (!responseMessage.trim()) {
        toast.error("Response cannot be empty");
        return false;
      }
      try {
        setLoading(true);
        const { error } = await fromExtended("partner_thought_pings")
          .update({
            status: "responded",
            response_message: responseMessage.trim(),
            responded_at: new Date().toISOString(),
            quick_reply_used: quickReply ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pingId);
        if (error) {
          logger.error("partner sync: respond failed", { error: error.message });
          toast.error("Failed to respond");
          return false;
        }
        const ping = pings.find(item => item.id === pingId);
        if (ping) {
          const traceId = createTraceId("ping-reply");
          await sendPushNotification(ping.sender_id, "Ping response", responseMessage.trim(), {
            pingId,
            traceId,
          });
        }
        await load();
        return true;
      } catch (err) {
        logger.error("partner sync: respond failed", { error: err });
        toast.error("Failed to respond");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load, pings],
  );

  const archive = useCallback(
    async (pingId: string) => {
      try {
        setLoading(true);
        const { error } = await fromExtended("partner_thought_pings")
          .update({
            status: "archived",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pingId);
        if (error) {
          logger.error("partner sync: archive failed", { error: error.message });
          toast.error("Failed to archive");
          return false;
        }
        await load();
        return true;
      } catch (err) {
        logger.error("partner sync: archive failed", { error: err });
        toast.error("Failed to archive");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load],
  );

  const togglePin = useCallback(
    async (pingId: string, isPinned: boolean) => {
      try {
        const { error } = await fromExtended("partner_thought_pings")
          .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
          .eq("id", pingId);
        if (error) {
          toast.error("Failed to update pin");
          return false;
        }
        await load();
        return true;
      } catch (err) {
        logger.error("partner sync: toggle pin failed", { error: err });
        return false;
      }
    },
    [load],
  );

  const addReaction = useCallback(
    async (pingId: string, emoji: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { error } = await fromExtended("partner_thought_ping_reactions").insert({
          ping_id: pingId,
          user_id: user.id,
          emoji,
          created_at: new Date().toISOString(),
        });
        if (error) {
          toast.error("Failed to add reaction");
          return false;
        }
        await loadReactions();
        return true;
      } catch (err) {
        logger.error("partner sync: add reaction failed", { error: err });
        return false;
      }
    },
    [loadReactions],
  );

  const removeReaction = useCallback(
    async (pingId: string, emoji: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { error } = await fromExtended("partner_thought_ping_reactions")
          .delete()
          .eq("ping_id", pingId)
          .eq("emoji", emoji)
          .eq("user_id", user.id);
        if (error) {
          toast.error("Failed to remove reaction");
          return false;
        }
        await loadReactions();
        return true;
      } catch (err) {
        logger.error("partner sync: remove reaction failed", { error: err });
        return false;
      }
    },
    [loadReactions],
  );

  const unreadCount = useMemo(
    () => pings.filter(p => p.status === "sent" && p.recipient_id === currentUserId).length,
    [pings, currentUserId],
  );

  return {
    pings,
    reactions,
    privateNotes,
    loading,
    currentUserId,
    unreadCount,
    loadMore,
    reload: load,
    sendPing,
    markRead,
    respond,
    archive,
    togglePin,
    addReaction,
    removeReaction,
  };
}
