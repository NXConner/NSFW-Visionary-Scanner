/**
 * Shared webhook security helpers for Edge Functions.
 *
 * Goal: prevent SSRF by blocking private/loopback/link-local/metadata targets and
 * requiring safe URL shapes before `fetch()`ing user-provided webhook URLs.
 */
export type WebhookUrlValidation =
  | { ok: true; normalizedUrl: string; url: URL }
  | { ok: false; error: string };

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  // Common cloud metadata endpoints
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.google",
]);

const BLOCKED_PORTS = new Set([22, 23, 25, 53, 110, 143, 445, 3306, 5432, 6379, 27017]);

function isIpv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isIpv6(host: string): boolean {
  // Rough check: contains ":" and hex chars; URL.hostname strips brackets.
  return host.includes(":");
}

function isPrivateIpv4(ip: string): boolean {
  if (!isIpv4(ip)) return false;
  if (ip === "0.0.0.0") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const b = Number(m[1]);
    if (Number.isFinite(b) && b >= 16 && b <= 31) return true;
  }
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1") return true;
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // fc00::/7 (ULA)
  if (v.startsWith("fe80:")) return true; // link-local
  if (v === "::") return true;
  return false;
}

async function resolvePublicIps(
  hostname: string,
): Promise<{ ok: true; ips: string[] } | { ok: false }> {
  try {
    // Supabase Edge runtime supports Deno.resolveDns.
    const a = await Deno.resolveDns(hostname, "A").catch(() => []);
    const aaaa = await Deno.resolveDns(hostname, "AAAA").catch(() => []);
    const ips = [...a, ...aaaa].map(v => String(v)).filter(Boolean);
    if (!ips.length) return { ok: false };
    return { ok: true, ips };
  } catch {
    return { ok: false };
  }
}

export async function validateOutboundWebhookUrl(
  rawInput: string,
  options?: { allowInsecureHttp?: boolean },
): Promise<WebhookUrlValidation> {
  const input = String(rawInput || "").trim();
  if (!input) return { ok: false, error: "webhook_url is required" };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "Invalid webhook URL" };
  }

  const allowHttp = Boolean(options?.allowInsecureHttp);
  const proto = url.protocol.toLowerCase();
  if (proto !== "https:" && !(allowHttp && proto === "http:")) {
    return { ok: false, error: "Only HTTPS URLs are allowed" };
  }

  if (url.username || url.password) {
    return { ok: false, error: "Webhook URLs with credentials are not allowed" };
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) return { ok: false, error: "Invalid webhook hostname" };
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, error: "Internal/private addresses are not allowed" };
  }

  // Validate port.
  const port = url.port ? Number(url.port) : proto === "https:" ? 443 : 80;
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return { ok: false, error: "Invalid webhook port" };
  }
  if (BLOCKED_PORTS.has(port)) {
    return { ok: false, error: `Port ${port} is not allowed for webhooks` };
  }

  // Direct IP checks (fast path).
  if (isIpv4(hostname) && isPrivateIpv4(hostname)) {
    return { ok: false, error: "Private IP addresses are not allowed" };
  }
  if (isIpv6(hostname) && isPrivateIpv6(hostname)) {
    return { ok: false, error: "Private IP addresses are not allowed" };
  }

  // DNS resolution to block DNS rebinding to private networks.
  if (!isIpv4(hostname) && !isIpv6(hostname)) {
    const resolved = await resolvePublicIps(hostname);
    if (!resolved.ok) {
      return { ok: false, error: "Unable to resolve webhook hostname" };
    }
    for (const ip of resolved.ips) {
      if (isIpv4(ip) && isPrivateIpv4(ip))
        return { ok: false, error: "Private IP targets are not allowed" };
      if (isIpv6(ip) && isPrivateIpv6(ip))
        return { ok: false, error: "Private IP targets are not allowed" };
    }
  }

  // Limit length (defense-in-depth).
  if (input.length > 2048) return { ok: false, error: "URL is too long" };

  return { ok: true, normalizedUrl: url.toString(), url };
}
