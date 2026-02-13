export const SUPABASE_INVALID_API_KEY_EVENT = "morphoscan:supabase-invalid-api-key";

export function isInvalidSupabaseApiKeyMessage(message: string): boolean {
  const msg = String(message || "");
  return /invalid api key/i.test(msg);
}

export function isInvalidSupabaseApiKeyError(err: unknown): boolean {
  try {
    const message = String((err as { message?: unknown })?.message ?? "");
    return isInvalidSupabaseApiKeyMessage(message);
  } catch {
    return false;
  }
}

export function emitSupabaseInvalidApiKeyEvent(): void {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(SUPABASE_INVALID_API_KEY_EVENT));
  } catch {
    // ignore
  }
}
