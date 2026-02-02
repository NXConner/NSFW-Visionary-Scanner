import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ScanRow } from "./types";

export async function requireUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please sign in");
    return null;
  }
  return user.id;
}

export async function getScan(scanId: string): Promise<ScanRow | null> {
  // scans table doesn't exist in current schema
  logger.debug("getScan: scans table not yet available", { scanId });
  return null;
}

export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function normalizeConfidenceLevel(level: number | null): number | null {
  if (level == null || !Number.isFinite(level)) return null;
  return clamp01(level / 100);
}
