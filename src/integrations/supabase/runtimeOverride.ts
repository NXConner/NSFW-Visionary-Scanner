export const SUPABASE_RUNTIME_OVERRIDE_KEYS = {
  url: "morphoscan_supabase_url_override",
  publishableKey: "morphoscan_supabase_publishable_key_override",
  updatedAt: "morphoscan_supabase_override_updated_at",
} as const;

export type SupabaseRuntimeOverride = {
  url: string;
  publishableKey: string;
};

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function sanitizeSupabaseUrl(raw: string): string {
  const input = String(raw ?? "").replace(/\s+/g, "").trim();
  if (!input) return "";

  // Allow users to paste "project-ref.supabase.co" without scheme.
  const withScheme = input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`;

  try {
    const u = new URL(withScheme);
    // Normalize: remove trailing slash.
    const normalized = `${u.protocol}//${u.host}`.replace(/\/+$/, "");
    return normalized;
  } catch {
    return "";
  }
}

export function sanitizeSupabasePublishableKey(raw: string): string {
  let k = String(raw ?? "").trim();
  // Allow pasting with quotes.
  if (
    (k.length >= 2 && k.startsWith('"') && k.endsWith('"')) ||
    (k.length >= 2 && k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1);
  }
  // Remove any whitespace/newlines introduced by copy/paste.
  k = k.replace(/\s+/g, "");
  if (!k) return "";

  // Never accept secret/service keys in the client. This prevents accidental leaks.
  if (k.startsWith("sb_secret_")) return "";

  return k;
}

export function redactSupabaseKey(key: string): string {
  const k = String(key ?? "");
  if (!k) return "";

  if (k.startsWith("sb_publishable_")) {
    const tail = k.slice(Math.max(0, k.length - 6));
    return `sb_publishable_…${tail}`;
  }
  // Legacy JWT anon keys start with "eyJ".
  if (k.startsWith("eyJ")) {
    const head = k.slice(0, 10);
    const tail = k.slice(Math.max(0, k.length - 6));
    return `${head}…${tail}`;
  }
  const tail = k.slice(Math.max(0, k.length - 6));
  return `…${tail}`;
}

export function readSupabaseRuntimeOverride(): Partial<SupabaseRuntimeOverride> {
  if (!hasWindow()) return {};
  try {
    const url = sanitizeSupabaseUrl(localStorage.getItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.url) || "");
    const publishableKey = sanitizeSupabasePublishableKey(
      localStorage.getItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.publishableKey) || "",
    );
    return {
      ...(url ? { url } : {}),
      ...(publishableKey ? { publishableKey } : {}),
    };
  } catch {
    return {};
  }
}

export function writeSupabaseRuntimeOverride(next: Partial<SupabaseRuntimeOverride>): void {
  if (!hasWindow()) return;
  try {
    const url = next.url != null ? sanitizeSupabaseUrl(next.url) : undefined;
    const publishableKey =
      next.publishableKey != null ? sanitizeSupabasePublishableKey(next.publishableKey) : undefined;

    if (url !== undefined) {
      if (url) localStorage.setItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.url, url);
      else localStorage.removeItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.url);
    }

    if (publishableKey !== undefined) {
      if (publishableKey) localStorage.setItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.publishableKey, publishableKey);
      else localStorage.removeItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.publishableKey);
    }

    localStorage.setItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.updatedAt, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function clearSupabaseRuntimeOverride(): void {
  if (!hasWindow()) return;
  try {
    localStorage.removeItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.url);
    localStorage.removeItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.publishableKey);
    localStorage.removeItem(SUPABASE_RUNTIME_OVERRIDE_KEYS.updatedAt);
  } catch {
    // ignore
  }
}

