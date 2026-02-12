import fs from "node:fs";
import path from "node:path";

export function firstSetEnv(keys, env = process.env) {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return "";
}

export function readProjectRefFromConfig({ repoRoot = process.cwd() } = {}) {
  const configPath = path.join(repoRoot, "supabase", "config.toml");
  if (!fs.existsSync(configPath)) return "";
  const configContent = fs.readFileSync(configPath, "utf8");
  const match = configContent.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1]?.trim() ?? "";
}

export function readLinkedPoolerHost({ repoRoot = process.cwd() } = {}) {
  // Supabase CLI writes a project-specific pooler URL when linked:
  //   supabase/.temp/pooler-url
  const poolerUrlPath = path.join(repoRoot, "supabase", ".temp", "pooler-url");
  if (!fs.existsSync(poolerUrlPath)) return "";
  const raw = String(fs.readFileSync(poolerUrlPath, "utf8") || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).hostname || "";
  } catch {
    const m = raw.match(/@([^:/\s]+)(?::\d+)?\//);
    return m?.[1]?.trim() ?? "";
  }
}

export function resolveProjectRef({
  projectRef = "",
  env = process.env,
  repoRoot = process.cwd(),
} = {}) {
  return (
    String(projectRef || "").trim() ||
    firstSetEnv(["SUPABASE_PROJECT_REF", "SUPABASE_PROJECT_ID", "VITE_SUPABASE_PROJECT_ID"], env) ||
    readProjectRefFromConfig({ repoRoot })
  );
}

export function parseDbHost(dbUrl) {
  try {
    return new URL(dbUrl).hostname || "";
  } catch {
    return "";
  }
}

export function redactDbUrl(dbUrl) {
  if (!dbUrl) return "";
  try {
    const parsed = new URL(dbUrl);
    if (parsed.password) parsed.password = "<redacted>";
    return parsed.toString();
  } catch {
    return "<redacted>";
  }
}

export function addSslmodeRequireIfMissing(dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return dbUrl;
  }
}

export function buildDirectSupabaseDbUrl({ projectRef, password }) {
  const url = new URL(`postgresql://postgres@db.${projectRef}.supabase.co:5432/postgres`);
  url.password = password;
  url.searchParams.set("sslmode", "require");
  return url.toString();
}

export function buildPoolerSupabaseDbUrl({ projectRef, password, poolerHost, port }) {
  const poolerPort = Number(port) || 6543;
  const url = new URL(`postgresql://postgres@${poolerHost}:${poolerPort}/postgres`);
  // For pooler connections, the tenant is encoded in the username: <db_user>.<project_ref>.
  url.username = `postgres.${projectRef}`;
  url.password = password;
  url.searchParams.set("sslmode", "require");
  return url.toString();
}

export function shouldUseSsl({ dbUrl, noSsl = false }) {
  if (noSsl) return false;
  let parsed;
  try {
    parsed = new URL(dbUrl);
  } catch {
    return false;
  }
  const host = parsed.hostname || "";
  const sslmode = (parsed.searchParams.get("sslmode") || "").toLowerCase();
  if (sslmode === "disable") return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com")) return true;
  return sslmode === "require" || sslmode === "verify-full" || sslmode === "verify-ca";
}

export function isLikelyConnectivityError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toLowerCase();
  return (
    code === "etimedout" ||
    code === "ehostunreach" ||
    code === "enetworkunreachable" ||
    msg.includes("network is unreachable") ||
    msg.includes("econnrefused") ||
    msg.includes("connect etimedout") ||
    msg.includes("connect ehostunreach")
  );
}

