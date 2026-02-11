import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsState, AnalyticsTimeRange, RawAnalyticsEvent } from "./types";
import { TIME_RANGES } from "./constants";
import { buildAnalyticsData } from "./utils";

const rangeDays = (range: AnalyticsTimeRange) =>
  TIME_RANGES.find(item => item.value === range)?.days ?? 30;

export function useAnalyticsDashboardData(options: {
  userId?: string | null;
  isAdmin?: boolean;
  timeRange: AnalyticsTimeRange;
  refreshKey?: number;
}): AnalyticsState {
  const { userId, isAdmin = false, timeRange, refreshKey } = options;
  const [state, setState] = useState<AnalyticsState>({ loading: true });

  const startDate = useMemo(() => {
    const days = rangeDays(timeRange);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [timeRange]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId && !isAdmin) {
        setState({ loading: false, data: undefined });
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: undefined }));

      try {
        const eventsQuery = supabase
          .from("app_analytics_events")
          .select(
            "event_name,event_category,event_action,created_at,user_id,session_id,device_platform",
          )
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true })
          .limit(10000);

        const scopedEventsQuery =
          isAdmin || !userId ? eventsQuery : eventsQuery.eq("user_id", userId);

        const [eventsResult, totalUsersResult, newUsersResult] = await Promise.all([
          scopedEventsQuery,
          isAdmin
            ? supabase.from("profiles").select("*", { count: "exact", head: true })
            : Promise.resolve({ count: userId ? 1 : 0 }),
          isAdmin
            ? supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("created_at", startDate.toISOString())
            : Promise.resolve({ count: 0 }),
        ]);

        if (cancelled) return;

        if (eventsResult.error) {
          throw eventsResult.error;
        }

        const events = (eventsResult.data ?? []) as RawAnalyticsEvent[];
        const totalUsers = Number(totalUsersResult.count ?? 0);
        const newUsers = Number(newUsersResult.count ?? 0);

        const data = buildAnalyticsData({
          events,
          totalUsers: totalUsers || (userId ? 1 : 0),
          newUsers,
        });

        setState({ loading: false, data });
      } catch (error) {
        if (cancelled) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load analytics",
        });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin, startDate, refreshKey]);

  return state;
}
