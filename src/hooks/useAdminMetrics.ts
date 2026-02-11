/**
 * Hook to fetch real admin dashboard metrics from database
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  dlcSales: string;
  supportTickets: number;
  newUsers: number;
  retention: number;
  loading: boolean;
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    dlcSales: "$0",
    supportTickets: 0,
    newUsers: 0,
    retention: 0,
    loading: true,
  });

  const fetchMetrics = useCallback(async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Active users (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // New users (created in last 30 days)
      const { count: newUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // DLC purchases total
      const { data: purchases } = await supabase
        .from("dlc_purchases")
        .select("price_paid")
        .eq("is_active", true);

      const totalDlcSales = purchases?.reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0;

      // Active subscriptions as "support tickets" proxy (or you could count beta testers)
      const { count: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calculate retention (users active vs total)
      const retention = totalUsers
        ? Math.round(((activeUsers || 0) / totalUsers) * 100 * 10) / 10
        : 0;

      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        dlcSales: `$${totalDlcSales.toLocaleString()}`,
        supportTickets: subscriptions || 0,
        newUsers: newUsers || 0,
        retention,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching admin metrics:", err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, refresh: fetchMetrics };
}
