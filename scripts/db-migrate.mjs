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
const mode = parseMode(process.argv.slice(2));
const flags = parseFlags(process.argv.slice(2));

// Avoid noisy dotenv tips in CI logs (values are still loaded when present).
dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });

function parseMode(args) {
  const modeArg = args.find(arg => arg.startsWith("--mode="));
  const raw = (modeArg ? modeArg.split("=")[1] : "auto").toLowerCase();
  if (!["auto", "local", "remote"].includes(raw)) {
    console.error(`Invalid mode "${raw}". Use one of: auto, local, remote (e.g. --mode=remote).`);
    process.exit(1);
  }
  return raw;
}

function parseFlags(args) {
  const readFlagValue = flagName => {
    const inline = args.find(arg => arg.startsWith(`${flagName}=`));
    if (inline) return String(inline.slice(flagName.length + 1)).trim();
    const idx = args.findIndex(arg => arg === flagName);
    if (idx >= 0 && idx + 1 < args.length) return String(args[idx + 1] || "").trim();
    return "";
  };

  const dryRun = args.includes("--dry-run") || args.includes("--plan");
  const projectRef = readFlagValue("--project-ref");
  const dbUrl = readFlagValue("--db-url");
  const dbPassword = readFlagValue("--db-password");
  const accessToken = readFlagValue("--access-token");
  return { dryRun, projectRef, dbUrl, dbPassword, accessToken };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const output = `${stdout}${stderr}`.trim();

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    output,
  };
}

function commandExists(command) {
  const result = run("bash", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.ok;
}

function dockerAvailable() {
  if (!commandExists("docker")) {
    return false;
  }
  const result = run("docker", ["info"], { stdio: "ignore" });
  return result.ok;
}

function firstSetEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function redactSupabaseArgs(args) {
  const redacted = [...args];
  const sensitiveFlags = new Set(["--db-url", "--password", "--token"]);
  for (let i = 0; i < redacted.length; i += 1) {
    if (sensitiveFlags.has(redacted[i]) && i + 1 < redacted.length) {
      redacted[i + 1] = "<redacted>";
      i += 1;
    }
  }
  return redacted;
}

function runSupabase(args, description) {
  console.log(`\n${description}`);
  console.log(`> npx supabase ${redactSupabaseArgs(args).join(" ")}`);
  const result = run("npx", ["supabase", ...args]);
  if (result.output) {
    console.log(result.output);
  }
  return result;
}

function runLocalMigration() {
  return runSupabase(
    ["migration", "up", "--yes"],
    "Applying pending migrations to local Supabase database...",
  );
}

function readProjectRefFromConfig() {
  const configPath = path.join(repoRoot, "supabase", "config.toml");
  if (!fs.existsSync(configPath)) {
    return "";
  }

  const configContent = fs.readFileSync(configPath, "utf8");
  const match = configContent.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1]?.trim() ?? "";
}

function readLinkedPoolerHost() {
  // Supabase CLI writes a project-specific pooler URL when linked:
  //   supabase/.temp/pooler-url
  // Example:
  //   postgresql://postgres.<ref>@aws-1-us-east-1.pooler.supabase.com:5432/postgres
  const poolerUrlPath = path.join(repoRoot, "supabase", ".temp", "pooler-url");
  if (!fs.existsSync(poolerUrlPath)) return "";
  const raw = String(fs.readFileSync(poolerUrlPath, "utf8") || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).hostname || "";
  } catch {
    // Fallback: best-effort parse for non-standard URL formats.
    const m = raw.match(/@([^:/\s]+)(?::\d+)?\//);
    return m?.[1]?.trim() ?? "";
  }
}

function resolveProjectRef() {
  return (
    flags.projectRef ||
    firstSetEnv(["SUPABASE_PROJECT_REF", "SUPABASE_PROJECT_ID", "VITE_SUPABASE_PROJECT_ID"]) ||
    readProjectRefFromConfig()
  );
}

function buildDirectDbUrlFromPassword({ projectRef, password }) {
  const url = new URL(`postgresql://postgres@db.${projectRef}.supabase.co:5432/postgres`);
  url.password = password;
  return url.toString();
}

function buildPoolerDbUrlFromPassword({ projectRef, password, poolerHost, port }) {
  const poolerPort = Number(port) || 6543;
  const url = new URL(`postgresql://postgres@${poolerHost}:${poolerPort}/postgres`);
  // For pooler connections, the tenant is encoded in the username.
  // Supabase format: <db_user>.<project_ref> (e.g. postgres.<ref>)
  url.username = `postgres.${projectRef}`;
  url.password = password;
  return url.toString();
}

function isNetworkUnreachable(output) {
  return typeof output === "string" && output.toLowerCase().includes("network is unreachable");
}

function isTenantOrUserNotFound(output) {
  return typeof output === "string" && output.toLowerCase().includes("tenant or user not found");
}

function runRemoteMigration() {
  const dryRunArgs = flags.dryRun ? ["--dry-run"] : [];
  const dbUrl =
    flags.dbUrl || firstSetEnv(["SUPABASE_DB_URL", "DATABASE_URL", "SUPABASE_DATABASE_URL"]);

  if (dbUrl) {
    const result = runSupabase(
      ["db", "push", "--db-url", dbUrl, ...dryRunArgs, "--yes", "--include-all"],
      flags.dryRun
        ? "Previewing migrations using explicit database URL (dry-run)..."
        : "Applying migrations using explicit database URL...",
    );
    if (result.ok) {
      return result;
    }
  } else {
    const password = flags.dbPassword || firstSetEnv(["SUPABASE_DB_PASSWORD", "POSTGRES_PASSWORD"]);

    // Prefer a Docker-less remote push that does NOT require Supabase API auth:
    // if the DB password is provided, we can construct the direct DB URL from project ref.
    const projectRef = resolveProjectRef();
    if (password && projectRef) {
      const directDbUrl = buildDirectDbUrlFromPassword({ projectRef, password });
      const result = runSupabase(
        ["db", "push", "--db-url", directDbUrl, ...dryRunArgs, "--yes", "--include-all"],
        flags.dryRun
          ? `Previewing migrations using SUPABASE_DB_PASSWORD + project ref (${projectRef}) (dry-run)...`
          : `Applying migrations using SUPABASE_DB_PASSWORD + project ref (${projectRef})...`,
      );
      if (result.ok) {
        return result;
      }

      // Some environments (like CI containers) have no IPv6 routing, and Supabase direct DB host
      // may be IPv6-only. Fall back to trying pooler endpoints across common regions.
      //
      // We only do this when it looks like an IPv6 routing issue or the pooler tenant is not found
      // (wrong region), to avoid noisy retries for bad passwords.
      if (isNetworkUnreachable(result.output) || isTenantOrUserNotFound(result.output)) {
        // Fast-path: if the Supabase CLI is linked, it already knows the correct pooler host.
        // Try that first to avoid a full region scan (which can take ~1 minute in CI).
        const linkedPoolerHost =
          firstSetEnv(["SUPABASE_POOLER_HOST", "SUPABASE_POOLER_HOSTNAME"]) ||
          readLinkedPoolerHost();
        if (linkedPoolerHost) {
          for (const port of [6543, 5432]) {
            const poolerDbUrl = buildPoolerDbUrlFromPassword({
              projectRef,
              password,
              poolerHost: linkedPoolerHost,
              port,
            });
            const attempt = runSupabase(
              ["db", "push", "--db-url", poolerDbUrl, ...dryRunArgs, "--yes", "--include-all"],
              flags.dryRun
                ? `Previewing migrations via linked pooler ${linkedPoolerHost}:${port} (dry-run)...`
                : `Retrying via linked pooler ${linkedPoolerHost}:${port}...`,
            );
            if (attempt.ok) {
              return attempt;
            }
          }
        }

        const poolerRegions = [
          // AWS regions Supabase commonly offers (ordered roughly by adoption).
          "us-east-1",
          "us-east-2",
          "us-west-1",
          "us-west-2",
          "ca-central-1",
          "eu-west-1",
          "eu-west-2",
          "eu-west-3",
          "eu-central-1",
          "eu-north-1",
          "eu-south-1",
          "ap-south-1",
          "ap-southeast-1",
          "ap-southeast-2",
          "ap-southeast-3",
          "ap-northeast-1",
          "ap-northeast-2",
          "ap-northeast-3",
          "sa-east-1",
          "me-south-1",
          "af-south-1",
        ];

        // Supabase runs multiple pooler clusters per region (e.g. aws-0, aws-1).
        const poolerClusters = ["aws-0", "aws-1"];

        const poolerHosts = poolerClusters.flatMap(cluster =>
          poolerRegions.map(region => `${cluster}-${region}.pooler.supabase.com`),
        );

        for (const poolerHost of poolerHosts) {
          // Supabase shows two poolers in the dashboard:
          // - Transaction pooler (port 6543)
          // - Session pooler (port 5432)
          // Different projects / network environments may only allow one reliably.
          for (const port of [6543, 5432]) {
            const poolerDbUrl = buildPoolerDbUrlFromPassword({
              projectRef,
              password,
              poolerHost,
              port,
            });

            const attempt = runSupabase(
              ["db", "push", "--db-url", poolerDbUrl, ...dryRunArgs, "--yes", "--include-all"],
              flags.dryRun
                ? `Previewing migrations via pooler host ${poolerHost}:${port} (dry-run)...`
                : `Retrying via pooler host ${poolerHost}:${port}...`,
            );

            if (attempt.ok) {
              return attempt;
            }

            // Keep scanning for wrong-region and common connectivity/DNS issues.
            // Break early only for errors that likely indicate a real credentials problem.
            const out = (attempt.output ?? "").toLowerCase();
            const isDnsError =
              out.includes("no such host") || out.includes("hostname resolving error");
            const isConnectivityError = isNetworkUnreachable(out) || out.includes("dial error");
            const isWrongRegion = isTenantOrUserNotFound(out);

            if (isWrongRegion || isDnsError || isConnectivityError) {
              // For tenant-not-found, it may be wrong region OR wrong pooler port.
              // Try the other port for the same host before moving on.
              continue;
            }

            // Example of a hard error where further scanning won't help (password wrong, etc.)
            break;
          }
        }
      }
    }

    const args = ["db", "push", "--linked", "--yes", "--include-all"];
    if (flags.dryRun) args.push("--dry-run");
    if (password) {
      args.push("--password", password);
    }
    let result = runSupabase(args, "Applying migrations to linked remote Supabase project...");
    if (
      !result.ok &&
      result.output.toLowerCase().includes("cannot find project ref. have you run supabase link?")
    ) {
      const projectRef = resolveProjectRef();
      if (projectRef) {
        const linkArgs = ["link", "--project-ref", projectRef, "--yes"];
        if (password) {
          linkArgs.push("--password", password);
        }

        const linkResult = runSupabase(
          linkArgs,
          `Linking Supabase CLI to project ${projectRef}...`,
        );

        if (linkResult.ok) {
          result = runSupabase(args, "Retrying migration push to linked remote project...");
        }
      }
    }

    if (result.ok) {
      return result;
    }
  }

  console.error("\nUnable to apply migrations remotely.");
  console.error("Provide one of the following and run again:");
  console.error("  1) --db-url=<postgres-url> (preferred full Postgres connection URL)");
  console.error("  2) SUPABASE_DB_URL (env; preferred full Postgres connection URL)");
  console.error(
    "  3) --db-password=<db-password> (works with --project-ref or supabase/config.toml)",
  );
  console.error("  4) SUPABASE_DB_PASSWORD (env; works with project_id in supabase/config.toml)");
  console.error(
    "  5) --project-ref=<project-ref> or SUPABASE_PROJECT_REF (override config project ref)",
  );
  console.error("  6) --access-token=<token> or SUPABASE_ACCESS_TOKEN if CLI is not authenticated");
  console.error("If you need local migrations, install/start Docker and use --mode=local.");
  process.exit(1);
}

function isExpectedLocalConnectivityError(output) {
  if (!output) return false;
  const haystack = output.toLowerCase();
  return (
    haystack.includes("connection refused") ||
    haystack.includes("cannot connect to the docker daemon") ||
    haystack.includes("failed to connect to postgres")
  );
}

function ensureSupabaseCli() {
  if (!commandExists("npx")) {
    console.error("npx is required to run Supabase CLI.");
    process.exit(1);
  }
}

function main() {
  process.chdir(repoRoot);
  ensureSupabaseCli();
  if (flags.accessToken) {
    process.env.SUPABASE_ACCESS_TOKEN = flags.accessToken;
  }

  console.log(`Migration mode: ${mode}`);
  if (flags.dryRun) console.log("Dry-run: enabled (no changes will be applied remotely)");

  if (mode === "local") {
    if (!dockerAvailable()) {
      console.error(
        "Docker is unavailable. Local migrations require Docker. Use --mode=remote instead.",
      );
      process.exit(1);
    }
    const result = runLocalMigration();
    process.exit(result.ok ? 0 : result.status);
  }

  if (mode === "remote") {
    const result = runRemoteMigration();
    process.exit(result.ok ? 0 : result.status);
  }

  if (dockerAvailable()) {
    const localResult = runLocalMigration();
    if (localResult.ok) {
      process.exit(0);
    }
    if (!isExpectedLocalConnectivityError(localResult.output)) {
      process.exit(localResult.status);
    }
    console.warn(
      "\nLocal migration failed due connectivity/runtime issue. Falling back to remote migration...",
    );
  } else {
    console.warn("\nDocker is not available. Falling back to remote migration path...");
  }

  const remoteResult = runRemoteMigration();
  process.exit(remoteResult.ok ? 0 : remoteResult.status);
}

main();
