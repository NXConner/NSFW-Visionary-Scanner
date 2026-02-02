import { useCallback, useEffect, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { PartnerSyncEvent } from "./types";
import { subscribeToTable } from "./realtime";

export function usePartnerEvents(connectionId: string | null, pageSize: number = 20) {
  const [events, setEvents] = useState<PartnerSyncEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [connectionId]);

  const load = useCallback(async () => {
    if (!connectionId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await fromExtended("partner_sync_events")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: false })
        .range(0, pageSize * (page + 1) - 1);
      if (error) {
        logger.error("partner sync: load events failed", { error: error.message });
        return;
      }
      setEvents((data || []) as PartnerSyncEvent[]);
    } finally {
      setLoading(false);
    }
  }, [connectionId, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!connectionId) return;
    const unsubscribe = subscribeToTable({
      table: "partner_sync_events",
      filter: `connection_id=eq.${connectionId}`,
      onChange: () => void load(),
    });
    return unsubscribe;
  }, [connectionId, load]);

  const loadMore = () => setPage(prev => prev + 1);

  return {
    events,
    loading,
    loadMore,
    reload: load,
  };
}
