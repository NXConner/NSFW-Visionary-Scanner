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

export function getEmptyCommunityAverages(params: {
  days: number;
  sampleSize?: number;
  computedAtIso?: string;
}): CommunityAverages {
  return {
    sampleSize: typeof params.sampleSize === "number" ? params.sampleSize : 0,
    isSufficient: false,
    avgLengthCm: null,
    avgGirthCm: null,
    windowDays: Math.max(1, Math.floor(params.days)),
    computedAtIso: params.computedAtIso ?? new Date().toISOString(),
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
      logger.warn("Community averages RPC failed", { error: error.message, days, minSample });
      return getEmptyCommunityAverages({ days });
    }

    const row: RpcRow | null = Array.isArray(data)
      ? ((data[0] as RpcRow | undefined) ?? null)
      : ((data as RpcRow | null) ?? null);

    if (!row) {
      return getEmptyCommunityAverages({ days });
    }

    const sampleSize = asNumber(row.sample_size) ?? 0;
    const windowDays = asNumber(row.window_days) ?? days;
    const isSufficient = Boolean(row.is_sufficient) && sampleSize >= Math.max(1, minSample);

    if (!isSufficient) {
      return {
        sampleSize,
        isSufficient: false,
        avgLengthCm: null,
        avgGirthCm: null,
        windowDays,
        computedAtIso: row.computed_at ?? new Date().toISOString(),
      };
    }

    return {
      sampleSize,
      isSufficient: true,
      avgLengthCm: asNumber(row.avg_length),
      avgGirthCm: asNumber(row.avg_girth),
      windowDays,
      computedAtIso: row.computed_at ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn("Community averages fetch crashed", { error: err, days, minSample });
    return getEmptyCommunityAverages({ days });
  }
}
