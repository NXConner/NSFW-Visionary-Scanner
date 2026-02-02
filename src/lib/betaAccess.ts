import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type BetaAccessStatus =
  | { active: false }
  | { active: true; expiresAt: string | null; enabled: true };

function isPostgrestMissingTable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return msg.includes("42P01") || msg.toLowerCase().includes("does not exist");
}

export async function fetchBetaAccessStatus(userId: string): Promise<BetaAccessStatus> {
  try {
    const { data, error } = await supabase
      .from("beta_testers")
      .select("enabled, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isPostgrestMissingTable(error)) return { active: false };
      logger.warn("Failed to fetch beta status", { userId, error: error.message });
      return { active: false };
    }

    if (!data?.enabled) return { active: false };
    const expiresAt = (data as unknown as { expires_at: string | null }).expires_at ?? null;
    if (expiresAt) {
      const exp = new Date(expiresAt);
      if (!Number.isFinite(exp.getTime())) return { active: false };
      if (exp.getTime() <= Date.now()) return { active: false };
    }

    return { active: true, enabled: true, expiresAt };
  } catch (e) {
    logger.warn("Failed to fetch beta status", {
      userId,
      error: e instanceof Error ? e.message : e,
    });
    return { active: false };
  }
}

export function useBetaAccess(userId: string | null | undefined): {
  status: BetaAccessStatus;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BetaAccessStatus>({ active: false });

  const refresh = useMemo(() => {
    return async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const next = await fetchBetaAccessStatus(userId);
        setStatus(next);
      } finally {
        setLoading(false);
      }
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStatus({ active: false });
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh, userId]);

  return { status, loading, refresh };
}
