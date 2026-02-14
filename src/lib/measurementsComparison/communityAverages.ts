import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { CommunityAverages } from "./types";

type RpcRow = {
  sample_size: number | string | null;
  is_sufficient: boolean | null;
  avg_length: number | string | null;
  avg_girth: number | string | null;
  window_days: number | string | null;
  computed_at: string | null;
};

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Back-compat helper (historically returned research baselines).
 *
 * We no longer return any synthetic averages. When community data is unavailable,
 * we return an "empty" snapshot with NULL averages and sampleSize=0.
 */
export function getPlaceholderCommunityAverages(): CommunityAverages {
  return {
    sampleSize: 0,
    isSufficient: false,
    isPlaceholder: false,
    avgLengthCm: null,
    avgGirthCm: null,
    windowDays: 0,
    computedAtIso: new Date().toISOString(),
    // Generic note used only when a backend dependency is missing/unreachable.
    // (UI can still provide a more specific message when sample size is simply insufficient.)
    placeholderNote: "Community averages are currently unavailable.",
  };
}

export async function fetchCommunityAverages(
  days: number,
  minSample: number,
): Promise<CommunityAverages> {
  try {
    const client = supabase as unknown as {
      rpc: (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data, error } = await client.rpc("get_app_userbase_measurement_averages", {
      p_days: days,
      p_min_sample: minSample,
    });

    if (error) {
      logger.warn("Community averages RPC failed, returning empty snapshot", {
        error: error.message,
        days,
        minSample,
      });
      return getPlaceholderCommunityAverages();
    }

    const row: RpcRow | null = Array.isArray(data)
      ? ((data[0] as RpcRow | undefined) ?? null)
      : ((data as RpcRow | null) ?? null);

    if (!row) {
      return getPlaceholderCommunityAverages();
    }

    const sampleSize = asNumber(row.sample_size) ?? 0;
    const windowDays = asNumber(row.window_days) ?? days;
    const isSufficient = Boolean(row.is_sufficient) && sampleSize >= Math.max(1, minSample);

    // If not sufficient, return real sample count but NULL averages (no synthetic values).
    if (!isSufficient) {
      return {
        sampleSize,
        windowDays,
        isSufficient: false,
        isPlaceholder: false,
        avgLengthCm: null,
        avgGirthCm: null,
        computedAtIso: row.computed_at ?? new Date().toISOString(),
      };
    }

    return {
      sampleSize,
      isSufficient: true,
      isPlaceholder: false,
      avgLengthCm: asNumber(row.avg_length),
      avgGirthCm: asNumber(row.avg_girth),
      windowDays,
      computedAtIso: row.computed_at ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn("Community averages fetch crashed, returning empty snapshot", {
      error: err,
      days,
      minSample,
    });
    return getPlaceholderCommunityAverages();
  }
}
