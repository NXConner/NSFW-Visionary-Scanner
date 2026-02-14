import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
export const typesPath = resolve(repoRoot, "src", "integrations", "supabase", "types.ts");
export const configTomlPath = resolve(repoRoot, "supabase", "config.toml");

export function normalizeNewlines(s) {
  return String(s).replace(/\r\n/g, "\n");
}

export function parseProjectIdFromConfigToml(tomlRaw) {
  const m = String(tomlRaw).match(/^\s*project_id\s*=\s*"([^"]+)"\s*$/m);
  return m?.[1] || null;
}

export function pickSupabaseBin() {
  const binName = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const local = resolve(repoRoot, "node_modules", ".bin", binName);
  if (existsSync(local)) return local;
  return "supabase";
}

export function run(cmd, args, env = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    // On Windows, executing *.cmd reliably requires a shell.
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function genArgsForLocal() {
  return ["gen", "types", "typescript", "--local"];
}

export function genArgsForDbUrl(dbUrl) {
  return [
    "gen",
    "types",
    "typescript",
    "--db-url",
    dbUrl,
    "--schema",
    "public",
    "--schema",
    "auth",
  ];
}

export function genArgsForProjectId(projectId) {
  return [
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
    "--schema",
    "auth",
  ];
}

export function isNonEmptyTypesOutput(stdout) {
  const s = String(stdout || "").trim();
  if (!s) return false;
  // Heuristic: generated types always declare Json at top.
  return /export\s+type\s+Json\s*=/.test(s) || /export\s+interface\s+Database\s*\{/.test(s);
}

export function resolveDbUrlFromEnv(env = process.env) {
  const candidates = [
    env.SUPABASE_DB_URL,
    env.SUPABASE_DATABASE_URL,
    env.DATABASE_URL,
  ]
    .map(v => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return candidates[0] || null;
}

export function resolveProjectIdFromEnvOrConfig(env = process.env) {
  const candidates = [
    env.SUPABASE_PROJECT_ID,
    env.SUPABASE_PROJECT_REF,
    env.VITE_SUPABASE_PROJECT_ID,
    env.VITE_SUPABASE_PROJECT_REF,
  ]
    .map(v => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  if (candidates[0]) return candidates[0];
  if (existsSync(configTomlPath)) {
    return parseProjectIdFromConfigToml(readFileSync(configTomlPath, "utf8"));
  }
  return null;
}

export function isLocalSupabaseRunning(supabaseBin) {
  const status = run(supabaseBin, ["status"]);
  return status.status === 0;
}

