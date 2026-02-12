#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const has = flag => argv.includes(flag);
  const read = flag => {
    const inline = argv.find(a => a.startsWith(`${flag}=`));
    if (inline) return String(inline.slice(flag.length + 1)).trim();
    const idx = argv.findIndex(a => a === flag);
    if (idx >= 0 && idx + 1 < argv.length) return String(argv[idx + 1] || "").trim();
    return "";
  };

  return {
    envFile: read("--env-file"),
    projectRef: read("--project-ref"),
    dbUrl: read("--db-url"),
    dbPassword: read("--db-password"),
    accessToken: read("--access-token"),
    apply: has("--apply"),
    typesCheck: has("--types-check"),
    skipDryRun: has("--skip-dry-run"),
  };
}

function fail(message) {
  console.error(`\n[release-ops] ${message}`);
  process.exit(1);
}

function run(command, args, description) {
  console.log(`\n[release-ops] ${description}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function loadEnvFile(envFilePath) {
  const resolved = path.isAbsolute(envFilePath) ? envFilePath : path.join(repoRoot, envFilePath);
  if (!fs.existsSync(resolved)) fail(`env file not found: ${resolved}`);
  const parsed = dotenv.parse(fs.readFileSync(resolved, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    // Deterministic behavior: the explicitly provided env file is source-of-truth.
    process.env[key] = String(value);
  }
  return resolved;
}

function ensureMinimumEnv() {
  const hasDbUrl = Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
  const hasDbPassword = Boolean(process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD);
  if (!hasDbUrl && !hasDbPassword) {
    fail(
      "missing database credentials. Set SUPABASE_DB_URL (preferred) or SUPABASE_DB_PASSWORD in env file.",
    );
  }
}

function main() {
  process.chdir(repoRoot);
  const args = parseArgs(process.argv.slice(2));
  if (!args.envFile) {
    fail(
      "missing --env-file. Example: node scripts/run-remote-release-ops.mjs --env-file .env.staging --types-check",
    );
  }

  const resolvedEnv = loadEnvFile(args.envFile);
  if (args.projectRef) process.env.SUPABASE_PROJECT_REF = args.projectRef;
  if (args.dbUrl) process.env.SUPABASE_DB_URL = args.dbUrl;
  if (args.dbPassword) process.env.SUPABASE_DB_PASSWORD = args.dbPassword;
  if (args.accessToken) process.env.SUPABASE_ACCESS_TOKEN = args.accessToken;

  ensureMinimumEnv();

  console.log(`[release-ops] Loaded env from ${resolvedEnv}`);
  if (process.env.SUPABASE_PROJECT_REF) {
    console.log(`[release-ops] Project ref: ${process.env.SUPABASE_PROJECT_REF}`);
  }

  const migrateArgs = ["scripts/db-migrate.mjs", "--mode=remote"];
  if (args.dbUrl) migrateArgs.push(`--db-url=${args.dbUrl}`);
  if (args.dbPassword) migrateArgs.push(`--db-password=${args.dbPassword}`);
  if (args.projectRef) migrateArgs.push(`--project-ref=${args.projectRef}`);
  if (args.accessToken) migrateArgs.push(`--access-token=${args.accessToken}`);

  if (!args.skipDryRun) {
    run(process.execPath, [...migrateArgs, "--dry-run"], "Running remote migration dry-run...");
  }

  if (args.apply) {
    run(process.execPath, migrateArgs, "Applying remote migrations...");
  }

  if (args.typesCheck) {
    const typeArgs = ["scripts/check-supabase-types-remote.mjs"];
    if (args.projectRef) typeArgs.push(`--project-ref=${args.projectRef}`);
    run(process.execPath, typeArgs, "Verifying remote schema/types alignment...");
  }

  console.log(
    "\n[release-ops] Next step: run docs/security/rls/RLS_STORAGE_AUDIT_QUERIES.sql in Supabase SQL editor.",
  );
  console.log("[release-ops] Completed.");
}

main();
