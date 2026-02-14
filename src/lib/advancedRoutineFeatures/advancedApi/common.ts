import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

export type Db = { from: (t: string) => ReturnType<typeof fromExtended> };

export const db: Db = { from: (t: string) => fromExtended(t as any) };

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num));
}

export function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
