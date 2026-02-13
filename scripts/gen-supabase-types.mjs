import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const typesPath = resolve(repoRoot, "src", "integrations", "supabase", "types.ts");
const configTomlPath = resolve(repoRoot, "supabase", "config.toml");

function normalizeNewlines(s) {
  return String(s).replace(/\r\n/g, "\n");
}

function parseProjectIdFromConfigToml(tomlRaw) {
  const m = String(tomlRaw).match(/^\s*project_id\s*=\s*"([^"]+)"\s*$/m);
  return m?.[1] || null;
}

function pickSupabaseBin() {
  const binName = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const local = resolve(repoRoot, "node_modules", ".bin", binName);
  if (existsSync(local)) return local;
  return "supabase";
}

function run(cmd, args, env = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function genArgsForLocal() {
  return ["gen", "types", "typescript", "--local"];
}

function genArgsForDbUrl(dbUrl) {
  return ["gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public", "--schema", "auth"];
}

function genArgsForProjectId(projectId) {
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

function isNonEmptyTypesOutput(stdout) {
  const s = String(stdout || "").trim();
  if (!s) return false;
  // Heuristic: generated types always declare Json at top.
  return /export\s+type\s+Json\s*=/.test(s) || /export\s+interface\s+Database\s*\{/.test(s);
}

function fail(msg, stderr) {
  if (msg) process.stderr.write(`${msg}\n`);
  if (stderr) process.stderr.write(String(stderr));
  process.exit(1);
}

const supabaseBin = pickSupabaseBin();
const explicitMode = String(process.env.SUPABASE_TYPES_MODE || "").trim().toLowerCase();
const dbUrl = process.env.SUPABASE_DB_URL ? String(process.env.SUPABASE_DB_URL) : null;

let projectId = null;
if (process.env.SUPABASE_PROJECT_ID) {
  projectId = String(process.env.SUPABASE_PROJECT_ID).trim() || null;
} else if (existsSync(configTomlPath)) {
  projectId = parseProjectIdFromConfigToml(readFileSync(configTomlPath, "utf8"));
}

// Generation order:
// - If SUPABASE_TYPES_MODE explicitly set, honor it.
// - Else prefer DB_URL (no docker; no access token needed).
// - Else try local (fast if available).
// - Else try project-id (requires SUPABASE_ACCESS_TOKEN).
const attempts = [];
if (explicitMode) {
  attempts.push(explicitMode);
} else if (dbUrl) {
  attempts.push("db-url");
} else {
  attempts.push("local", "project-id");
}

let lastErr = null;
for (const mode of attempts) {
  if (mode === "db-url") {
    if (!dbUrl) continue;
    const res = run(supabaseBin, genArgsForDbUrl(dbUrl));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from db-url to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  if (mode === "local") {
    const res = run(supabaseBin, genArgsForLocal());
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from local Supabase to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  if (mode === "project-id") {
    if (!projectId) {
      lastErr = { stderr: "[db:types] Missing SUPABASE_PROJECT_ID and supabase/config.toml project_id\n" };
      continue;
    }
    const res = run(supabaseBin, genArgsForProjectId(projectId));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from project-id to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  lastErr = { stderr: `[db:types] Unknown mode: ${mode}\n` };
}

fail(
  "[db:types] Failed to generate Supabase types.\n" +
    "Set one of:\n" +
    "- SUPABASE_DB_URL (recommended for CI/remote)\n" +
    "- SUPABASE_ACCESS_TOKEN (for --project-id generation)\n" +
    "- Or run local Supabase with Docker and use --local\n",
  lastErr?.stderr,
);

