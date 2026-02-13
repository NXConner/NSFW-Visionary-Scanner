import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

export const RUN_SQL_FILE_USAGE = `
Usage:
  node scripts/run-sql-file.mjs [options] <file.sql> [more.sql...]

Options:
  --env-file <path>              Load env vars from a dotenv file (overrides current env)
  --db-url <postgres-url>        Full Postgres connection URL (preferred)
  --db-password <password>       Supabase DB password (fallback if --db-url missing)
  --project-ref <ref>            Supabase project ref (fallback if --db-url missing)
  --pooler-host <host>           Supabase pooler host override (optional)
  --max-rows <n>                 Max rows to print per statement (default: 200)
  --format <pretty|json>         Output format (default: pretty)
  --connect-timeout-ms <n>       Connection timeout in ms (default: 15000)
  --statement-timeout-ms <n>     statement_timeout in ms (default: 30000; 0 disables)
  --single-transaction           Run all statements in a single transaction
  --continue-on-error            Continue running remaining statements after an error
  --no-ssl                       Disable SSL even for Supabase hosts
  -h, --help                     Show help

Env fallbacks:
  SUPABASE_DB_URL, DATABASE_URL
  SUPABASE_DB_PASSWORD, POSTGRES_PASSWORD
  SUPABASE_PROJECT_REF, SUPABASE_PROJECT_ID, VITE_SUPABASE_PROJECT_ID
  SUPABASE_POOLER_HOST, SUPABASE_POOLER_HOSTNAME
`;

export function printRunSqlFileUsageAndExit(exitCode = 0) {
  process.stdout.write(RUN_SQL_FILE_USAGE.trimStart() + "\n");
  process.exit(exitCode);
}

function withoutFrom(source, flag) {
  const out = [];
  for (let i = 0; i < source.length; i += 1) {
    const a = source[i];
    if (a === flag) {
      i += 1;
      continue;
    }
    if (a.startsWith(`${flag}=`)) continue;
    out.push(a);
  }
  return out;
}

export function parseRunSqlFileArgs(argv) {
  const args = [...argv];
  const has = flag => args.includes(flag);
  const read = (flag, fallback = "") => {
    const inline = args.find(a => a.startsWith(`${flag}=`));
    if (inline) return String(inline.slice(flag.length + 1)).trim();
    const idx = args.findIndex(a => a === flag);
    if (idx >= 0 && idx + 1 < args.length) return String(args[idx + 1] || "").trim();
    return fallback;
  };

  const envFile = read("--env-file", "");
  const dbUrl = read("--db-url", "");
  const dbPassword = read("--db-password", "");
  const projectRef = read("--project-ref", "");
  const poolerHost = read("--pooler-host", "");
  const maxRows = Number(read("--max-rows", "200")) || 200;
  const format = (read("--format", "pretty") || "pretty").toLowerCase();
  const connectTimeoutMs = Number(read("--connect-timeout-ms", "15000")) || 15000;
  const statementTimeoutMs = Number(read("--statement-timeout-ms", "30000")) || 30000;
  const singleTransaction = has("--single-transaction");
  const continueOnError = has("--continue-on-error");
  const noSsl = has("--no-ssl");
  const help = has("--help") || has("-h");

  const cleaned = [
    "--env-file",
    "--db-url",
    "--db-password",
    "--project-ref",
    "--pooler-host",
    "--max-rows",
    "--format",
    "--connect-timeout-ms",
    "--statement-timeout-ms",
  ].reduce((acc, flag) => withoutFrom(acc, flag), args);

  const files = cleaned.filter(a => !a.startsWith("-"));

  return {
    envFile,
    dbUrl,
    dbPassword,
    projectRef,
    poolerHost,
    maxRows,
    format,
    connectTimeoutMs,
    statementTimeoutMs,
    singleTransaction,
    continueOnError,
    noSsl,
    help,
    files,
  };
}

export function loadEnvFile({ envFilePath, repoRoot }) {
  const resolved = path.isAbsolute(envFilePath) ? envFilePath : path.join(repoRoot, envFilePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`env file not found: ${resolved}`);
  }
  const parsed = dotenv.parse(fs.readFileSync(resolved, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    // Deterministic behavior: the explicitly provided env file is source-of-truth.
    process.env[key] = String(value);
  }
  return resolved;
}
