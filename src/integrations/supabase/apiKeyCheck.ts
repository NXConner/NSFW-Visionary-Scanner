export type SupabaseApiKeyCheckResult = "valid" | "invalid" | "unknown";

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(t),
  };
}

function normalizeBaseUrl(url: string): string {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

function isInvalidApiKeyPayload(payload: unknown): boolean {
  try {
    const msg = String((payload as { message?: unknown })?.message ?? "");
    return /invalid api key/i.test(msg);
  } catch {
    return false;
  }
}

export async function checkSupabaseApiKeyValid(params: {
  url: string;
  publishableKey: string;
  timeoutMs?: number;
}): Promise<SupabaseApiKeyCheckResult> {
  const url = normalizeBaseUrl(params.url);
  const key = String(params.publishableKey || "").trim();
  const timeoutMs = Math.max(500, Number(params.timeoutMs ?? 3500));

  if (!url || !key) return "invalid";

  // Never treat secret keys as "valid" in the client.
  if (key.startsWith("sb_secret_")) return "invalid";

  // Browser-only (uses window + fetch).
  if (typeof window === "undefined" || typeof fetch === "undefined") return "unknown";

  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const tryRequest = async (
      headers: Record<string, string>,
    ): Promise<SupabaseApiKeyCheckResult> => {
      const res = await fetch(`${url}/auth/v1/settings`, {
        method: "GET",
        headers,
        signal,
      });

      if (res.ok) return "valid";

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (isInvalidApiKeyPayload(payload)) return "invalid";
      return "unknown";
    };

    // Default behavior matches supabase-js headers.
    const first = await tryRequest({
      apikey: key,
      Authorization: `Bearer ${key}`,
    });
    if (first === "valid") return "valid";

    // Some environments may accept sb_publishable keys only as `apikey`
    // and reject the same value as a Bearer token.
    if (first === "invalid" && key.startsWith("sb_publishable_")) {
      const second = await tryRequest({ apikey: key });
      if (second === "valid") return "valid";
      if (second === "invalid") return "invalid";
      return "unknown";
    }

    return first;
  } catch {
    return "unknown";
  } finally {
    cancel();
  }
}
