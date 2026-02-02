import { supabase } from "@/integrations/supabase/client";

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseDateTimeLocalToIso(value: string): string {
  const v = String(value || "").trim();
  if (!v) return nowIso();
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return nowIso();
}
