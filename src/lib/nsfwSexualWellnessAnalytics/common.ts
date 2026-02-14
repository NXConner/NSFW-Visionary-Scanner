import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

type AuthedUser = { id: string };

export async function requireUser(): Promise<AuthedUser | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) logger.warn("NSFWWellness: auth.getUser failed", { error: error.message });
    if (!data.user) {
      toast.error("Please sign in");
      return null;
    }
    return { id: data.user.id };
  } catch (error) {
    logger.error("NSFWWellness: auth.getUser unexpected error", { error });
    toast.error("Please sign in");
    return null;
  }
}

export const db = (table: string) => fromExtended(table as any);

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const avg = (values: Array<number | null | undefined>): number | null => {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

export const toScore100From10 = (value10: number | null): number | null => {
  if (value10 === null) return null;
  return clamp((value10 / 10) * 100, 0, 100);
};

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(0, days));
  return d.toISOString().split("T")[0];
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}
