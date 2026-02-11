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

dotenv.config({ path: path.join(repoRoot, ".env") });

function parseMode(args) {
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const raw = (modeArg ? modeArg.split("=")[1] : "auto").toLowerCase();
  if (!["auto", "local", "remote"].includes(raw)) {
    console.error(
      `Invalid mode "${raw}". Use one of: auto, local, remote (e.g. --mode=remote).`,
    );
    process.exit(1);
  }
  return raw;
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

function buildDirectDbUrlFromPassword({ projectRef, password }) {
  const url = new URL(
    `postgresql://postgres@db.${projectRef}.supabase.co:5432/postgres`,
  );
  url.password = password;
  return url.toString();
}

function runRemoteMigration() {
  const dbUrl = firstSetEnv([
    "SUPABASE_DB_URL",
    "DATABASE_URL",
    "SUPABASE_DATABASE_URL",
  ]);

  if (dbUrl) {
    const result = runSupabase(
      ["db", "push", "--db-url", dbUrl, "--yes", "--include-all"],
      "Applying migrations using explicit database URL...",
    );
    if (result.ok) {
      return result;
    }
  } else {
    const password = firstSetEnv(["SUPABASE_DB_PASSWORD", "POSTGRES_PASSWORD"]);

    // Prefer a Docker-less remote push that does NOT require Supabase API auth:
    // if the DB password is provided, we can construct the direct DB URL from project ref.
    const projectRef = readProjectRefFromConfig();
    if (password && projectRef) {
      const directDbUrl = buildDirectDbUrlFromPassword({ projectRef, password });
      const result = runSupabase(
        ["db", "push", "--db-url", directDbUrl, "--yes", "--include-all"],
        `Applying migrations using SUPABASE_DB_PASSWORD + project ref (${projectRef})...`,
      );
      if (result.ok) {
        return result;
      }
    }

    const args = ["db", "push", "--linked", "--yes", "--include-all"];
    if (password) {
      args.push("--password", password);
    }
    let result = runSupabase(
      args,
      "Applying migrations to linked remote Supabase project...",
    );
    if (
      !result.ok &&
      result.output
        .toLowerCase()
        .includes("cannot find project ref. have you run supabase link?")
    ) {
      const projectRef = readProjectRefFromConfig();
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
          result = runSupabase(
            args,
            "Retrying migration push to linked remote project...",
          );
        }
      }
    }

    if (result.ok) {
      return result;
    }
  }

  console.error("\nUnable to apply migrations remotely.");
  console.error("Set one of the following and run again:");
  console.error("  1) SUPABASE_DB_URL (preferred full Postgres connection URL)");
  console.error(
    "  2) SUPABASE_DB_PASSWORD (preferred; works with project_id in supabase/config.toml)",
  );
  console.error(
    "  3) SUPABASE_ACCESS_TOKEN if Supabase CLI is not already authenticated",
  );
  console.error(
    "If you need local migrations, install/start Docker and use --mode=local.",
  );
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

  console.log(`Migration mode: ${mode}`);

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
    console.warn(
      "\nDocker is not available. Falling back to remote migration path...",
    );
  }

  const remoteResult = runRemoteMigration();
  process.exit(remoteResult.ok ? 0 : remoteResult.status);
}

main();
