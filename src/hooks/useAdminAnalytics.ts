import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsPeriod = "24h" | "7d" | "30d" | "90d";

interface AnalyticsSeriesPoint {
  date: string;
  count: number;
}

interface TopEvent {
  name: string;
  count: number;
}

interface AdminAnalyticsState {
  loading: boolean;
  totalEvents: number;
  activeUsers: number;
  activeSessions: number;
  newUsers: number;
  dlcRevenue: number;
  dlcSales: number;
  series: AnalyticsSeriesPoint[];
  topEvents: TopEvent[];
}

const DEFAULT_STATE: AdminAnalyticsState = {
  loading: true,
  totalEvents: 0,
  activeUsers: 0,
  activeSessions: 0,
  newUsers: 0,
  dlcRevenue: 0,
  dlcSales: 0,
  series: [],
  topEvents: [],
};

const periodDays: Record<AnalyticsPeriod, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function useAdminAnalytics(period: AnalyticsPeriod) {
  const [state, setState] = useState<AdminAnalyticsState>(DEFAULT_STATE);

  const startDate = useMemo(() => {
    const days = periodDays[period];
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [period]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const [{ data: events }, { count: newUsers }, { data: purchases }] = await Promise.all([
          supabase
            .from("app_analytics_events")
            .select("event_name, created_at, user_id, session_id")
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true })
            .limit(10000),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startDate.toISOString()),
          supabase
            .from("dlc_purchases")
            .select("price_paid, purchased_at")
            .gte("purchased_at", startDate.toISOString()),
        ]);

        if (cancelled) return;

        const eventList = events ?? [];
        const eventMap = new Map<string, number>();
        const seriesMap = new Map<string, number>();
        const userSet = new Set<string>();
        const sessionSet = new Set<string>();

        for (const event of eventList) {
          const name = event.event_name || "unknown";
          eventMap.set(name, (eventMap.get(name) ?? 0) + 1);

          if (event.user_id) userSet.add(event.user_id);
          if (event.session_id) sessionSet.add(event.session_id);

          const day = new Date(event.created_at);
          const key = day.toISOString().split("T")[0];
          seriesMap.set(key, (seriesMap.get(key) ?? 0) + 1);
        }

        const series = Array.from(seriesMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const topEvents = Array.from(eventMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const dlcRevenue = (purchases ?? []).reduce(
          (sum, p) => sum + (p.price_paid ? Number(p.price_paid) : 0),
          0,
        );

        setState({
          loading: false,
          totalEvents: eventList.length,
          activeUsers: userSet.size,
          activeSessions: sessionSet.size,
          newUsers: newUsers ?? 0,
          dlcRevenue,
          dlcSales: purchases?.length ?? 0,
          series,
          topEvents,
        });
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [startDate]);

  return state;
}
