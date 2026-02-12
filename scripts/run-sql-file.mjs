#!/usr/bin/env node
/**
 * Run one or more .sql files against a Postgres database.
 *
 * Credentials (preferred):
 *  - --db-url="<postgresql://...>" OR env SUPABASE_DB_URL / DATABASE_URL
 *
 * Credentials (fallback):
 *  - --db-password / env SUPABASE_DB_PASSWORD + --project-ref / supabase/config.toml project_id
 *
 * Notes:
 *  - Secrets are never printed (DB URLs are redacted).
 *  - Defaults to SSL for Supabase hosts and no SSL for localhost.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import { connectPgClient, runSqlStatements } from "./_shared/pgRunner.mjs";
import { splitSqlStatements } from "./_shared/sqlSplit.mjs";
import {
  loadEnvFile,
  parseRunSqlFileArgs,
  printRunSqlFileUsageAndExit,
} from "./_shared/runSqlFileCli.mjs";
import {
  addSslmodeRequireIfMissing,
  buildDirectSupabaseDbUrl,
  buildPoolerSupabaseDbUrl,
  firstSetEnv,
  isLikelyConnectivityError,
  parseDbHost,
  readLinkedPoolerHost,
  redactDbUrl,
  resolveProjectRef,
} from "./_shared/supabaseDb.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main() {
  process.chdir(repoRoot);

  // Quiet-load default .env when present (does not overwrite explicit env).
  dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });

  const flags = parseRunSqlFileArgs(process.argv.slice(2));
  if (flags.help) printRunSqlFileUsageAndExit(0);

  if (!flags.files.length) {
    process.stderr.write("[run-sql-file] Missing .sql file path.\n\n");
    printRunSqlFileUsageAndExit(1);
  }
  if (!["pretty", "json"].includes(flags.format)) {
    process.stderr.write(`[run-sql-file] Invalid --format "${flags.format}". Use pretty|json.\n`);
    process.exit(1);
  }

  if (flags.envFile) {
    const loaded = loadEnvFile({ envFilePath: flags.envFile, repoRoot });
    if (flags.format === "pretty") {
      // eslint-disable-next-line no-console
      console.log(`[run-sql-file] Loaded env from ${path.relative(repoRoot, loaded)}`);
    }
  }

  const sqlFiles = flags.files.map(f => (path.isAbsolute(f) ? f : path.join(repoRoot, f)));
  for (const f of sqlFiles) {
    if (!fs.existsSync(f)) {
      process.stderr.write(`[run-sql-file] SQL file not found: ${f}\n`);
      process.exit(1);
    }
  }

  const password = flags.dbPassword || firstSetEnv(["SUPABASE_DB_PASSWORD", "POSTGRES_PASSWORD"]);
  const projectRef = resolveProjectRef({ projectRef: flags.projectRef, repoRoot });

  let dbUrl =
    flags.dbUrl || firstSetEnv(["SUPABASE_DB_URL", "DATABASE_URL", "SUPABASE_DATABASE_URL"]);
  if (!dbUrl && password && projectRef) {
    dbUrl = buildDirectSupabaseDbUrl({ projectRef, password });
  }
  if (!dbUrl) {
    process.stderr.write(
      "[run-sql-file] Missing database credentials.\n" +
        "Provide --db-url or set SUPABASE_DB_URL / DATABASE_URL.\n" +
        "Fallback: set SUPABASE_DB_PASSWORD and SUPABASE_PROJECT_REF (or supabase/config.toml project_id).\n",
    );
    process.exit(1);
  }

  const host = parseDbHost(dbUrl);
  if (!flags.noSsl && (host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com"))) {
    dbUrl = addSslmodeRequireIfMissing(dbUrl);
  }

  if (flags.format === "pretty") {
    // eslint-disable-next-line no-console
    console.log(`[run-sql-file] DB: ${redactDbUrl(dbUrl)}`);
  }

  let client;
  try {
    client = await connectPgClient({
      dbUrl,
      connectTimeoutMs: flags.connectTimeoutMs,
      statementTimeoutMs: flags.statementTimeoutMs,
      noSsl: flags.noSsl,
      applicationName: "run-sql-file",
    });
  } catch (err) {
    // If we built a direct Supabase DB URL from password and connectivity fails,
    // attempt a pooler fallback when we can infer the pooler host.
    if (!flags.dbUrl && password && projectRef && isLikelyConnectivityError(err)) {
      const poolerHost =
        flags.poolerHost ||
        firstSetEnv(["SUPABASE_POOLER_HOST", "SUPABASE_POOLER_HOSTNAME"]) ||
        readLinkedPoolerHost({ repoRoot });
      if (poolerHost) {
        for (const port of [6543, 5432]) {
          const poolerUrl = buildPoolerSupabaseDbUrl({
            projectRef,
            password,
            poolerHost,
            port,
          });
          try {
            if (flags.format === "pretty") {
              // eslint-disable-next-line no-console
              console.warn(
                `[run-sql-file] Direct DB host unreachable; retrying via pooler ${poolerHost}:${port}...`,
              );
              // eslint-disable-next-line no-console
              console.log(`[run-sql-file] DB: ${redactDbUrl(poolerUrl)}`);
            }
            client = await connectPgClient({
              dbUrl: poolerUrl,
              connectTimeoutMs: flags.connectTimeoutMs,
              statementTimeoutMs: flags.statementTimeoutMs,
              noSsl: flags.noSsl,
              applicationName: "run-sql-file",
            });
            dbUrl = poolerUrl;
            break;
          } catch {
            // Try next port.
          }
        }
      }
    }

    if (!client) {
      const msg = String(err?.message || err || "Unknown error");
      process.stderr.write(`[run-sql-file] Failed to connect: ${msg}\n`);
      process.exit(1);
    }
  }

  const aggregate = [];
  let hadError = false;

  try {
    if (flags.singleTransaction) {
      await client.query("BEGIN;");
    }

    for (const sqlFile of sqlFiles) {
      const raw = fs.readFileSync(sqlFile, "utf8");
      const statements = splitSqlStatements(raw);
      if (flags.format === "pretty") {
        // eslint-disable-next-line no-console
        console.log(
          `\n[run-sql-file] Running ${statements.length} statement(s) from ${path.relative(repoRoot, sqlFile)}...`,
        );
      }

      const runResult = await runSqlStatements({
        client,
        statements,
        maxRows: flags.maxRows,
        format: flags.format,
        continueOnError: flags.continueOnError,
      });

      aggregate.push({
        file: path.relative(repoRoot, sqlFile),
        statementCount: statements.length,
        results: runResult.results,
      });

      hadError = hadError || runResult.hadError;
      if (hadError && !flags.continueOnError) break;
    }

    if (flags.singleTransaction) {
      if (hadError) await client.query("ROLLBACK;");
      else await client.query("COMMIT;");
    }
  } finally {
    await client.end().catch(() => {});
  }

  if (flags.format === "json") {
    process.stdout.write(
      JSON.stringify({ dbHost: parseDbHost(dbUrl), files: aggregate }, null, 2) + "\n",
    );
  }

  process.exit(hadError ? 1 : 0);
}

main().catch(err => {
  const msg = String(err?.message || err || "Unknown error");
  process.stderr.write(`[run-sql-file] Fatal: ${msg}\n`);
  process.exit(1);
});

