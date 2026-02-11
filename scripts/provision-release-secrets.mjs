#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const GH_ENV_KEYS = [
  "SUPABASE_DB_URL",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_ACCESS_TOKEN",
];

const GH_REPO_KEYS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];

const SUPABASE_EDGE_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_PREMIUM_PRICE_ID",
  "DLC_KEYRING_MASTER_KEY_B64",
  "NSFW_CONTENT_BUCKET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "DATA_RETENTION_SECRET",
  "FIREBASE_SERVICE_ACCOUNT",
  "APNS_KEY_P8",
  "APNS_KEY_ID",
  "APNS_TEAM_ID",
  "APNS_BUNDLE_ID",
  "APNS_USE_SANDBOX",
  "LOVABLE_API_KEY",
  "LOVABLE_AI_GATEWAY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "CUSTOM_AI_API_KEY",
  "CUSTOM_AI_ENDPOINT",
  "CONTENT_POLICY",
  "ENABLE_MEDICAL_AI_CHAT",
  "ENABLE_GENITAL_HEALTH_AI",
  "ALLOW_UNLICENSED_SEDUCTIVE_AI",
  "SEDUCTIVE_AI_PROVIDER",
  "SEDUCTIVE_AI_ENDPOINT",
  "SEDUCTIVE_AI_MODEL",
  "SEDUCTIVE_AI_MODE",
  "SEDUCTIVE_AI_MAX_TOKENS",
  "SEDUCTIVE_AI_MAX_MESSAGE_CHARS",
  "SEDUCTIVE_AI_MEMORY_WINDOW",
  "SEDUCTIVE_AI_MEMORY_MAX",
  "SEDUCTIVE_AI_TOP_P",
  "SEDUCTIVE_AI_PRESENCE_PENALTY",
  "SEDUCTIVE_AI_FREQUENCY_PENALTY",
  "SEDUCTIVE_AI_RATE_LIMIT_MINUTE",
  "SEDUCTIVE_AI_RATE_LIMIT_HOUR",
  "SEDUCTIVE_AI_RATE_LIMIT_DAY",
  "APP_URL",
];

function parseArgs(argv) {
  const has = flag => argv.includes(flag);
  const read = flag => {
    const inline = argv.find(arg => arg.startsWith(`${flag}=`));
    if (inline) return String(inline.slice(flag.length + 1)).trim();
    const idx = argv.findIndex(arg => arg === flag);
    if (idx >= 0 && idx + 1 < argv.length) return String(argv[idx + 1] || "").trim();
    return "";
  };

  return {
    envFile: read("--env-file"),
    environment: read("--environment").toLowerCase(),
    repo: read("--repo"),
    projectRef: read("--project-ref"),
    dryRun: has("--dry-run"),
    skipGh: has("--skip-gh"),
    skipSupabase: has("--skip-supabase"),
  };
}

function fail(message) {
  console.error(`\n[secrets-provision] ${message}`);
  process.exit(1);
}

function run(command, args, { description, dryRun = false } = {}) {
  if (description) console.log(`\n[secrets-provision] ${description}`);
  if (dryRun) {
    console.log(`[dry-run] ${command} ${args.join(" ")}`);
    return;
  }
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function commandExists(command) {
  const result = spawnSync("bash", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function readOriginRepo() {
  const result = spawnSync("git", ["config", "--get", "remote.origin.url"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  const remote = String(result.stdout || "").trim();
  if (!remote) return "";

  // https://github.com/owner/repo.git
  const httpsMatch = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i);
  if (httpsMatch?.[1] && httpsMatch?.[2]) return `${httpsMatch[1]}/${httpsMatch[2]}`;
  return "";
}

function parseEnvFile(envFilePath) {
  const resolved = path.isAbsolute(envFilePath) ? envFilePath : path.join(repoRoot, envFilePath);
  if (!fs.existsSync(resolved)) fail(`env file not found: ${resolved}`);
  const parsed = dotenv.parse(fs.readFileSync(resolved, "utf8"));
  return { resolved, parsed };
}

function escapeDotenvValue(value) {
  const raw = String(value ?? "");
  if (/^[A-Za-z0-9._:/@+-]*$/.test(raw)) return raw;
  return `"${raw.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/"/g, '\\"')}"`;
}

function writeTempEnvFile(name, kv) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-secrets-"));
  const file = path.join(dir, `${name}.env`);
  const content = Object.entries(kv)
    .map(([k, v]) => `${k}=${escapeDotenvValue(v)}`)
    .join("\n");
  fs.writeFileSync(file, content + "\n", "utf8");
  return { dir, file };
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function main() {
  process.chdir(repoRoot);
  const args = parseArgs(process.argv.slice(2));
  if (!args.envFile) fail("missing --env-file");
  if (!["staging", "production"].includes(args.environment)) {
    fail("missing/invalid --environment (use staging|production)");
  }

  const { resolved, parsed } = parseEnvFile(args.envFile);
  const prefix = `${args.environment.toUpperCase()}_`;
  const getValue = key => {
    const candidates = [key, `${prefix}${key}`];
    for (const c of candidates) {
      const fromFile = parsed[c];
      if (nonEmpty(fromFile)) return String(fromFile).trim();
      const fromEnv = process.env[c];
      if (nonEmpty(fromEnv)) return String(fromEnv).trim();
    }
    return "";
  };

  const repo = args.repo || readOriginRepo();
  const projectRef = args.projectRef || getValue("SUPABASE_PROJECT_REF");
  const accessToken = getValue("SUPABASE_ACCESS_TOKEN");
  if (nonEmpty(accessToken) && !process.env.SUPABASE_ACCESS_TOKEN) {
    process.env.SUPABASE_ACCESS_TOKEN = accessToken;
  }

  console.log(`[secrets-provision] Loaded secrets source: ${resolved}`);
  console.log(`[secrets-provision] Environment: ${args.environment}`);

  if (!args.skipGh) {
    if (!commandExists("gh")) fail("gh CLI is required for GitHub secret provisioning.");
    if (!repo) fail("cannot determine repo. Provide --repo owner/repo.");
  }

  if (!args.skipSupabase) {
    if (!commandExists("npx")) fail("npx is required for Supabase secret provisioning.");
    if (!projectRef) fail("missing SUPABASE_PROJECT_REF (or pass --project-ref).");
  }

  // GitHub environment secrets for manual deploy workflow
  if (!args.skipGh) {
    const ghEnvSecrets = Object.fromEntries(
      GH_ENV_KEYS.map(key => [key, getValue(key)]).filter(([, value]) => nonEmpty(value)),
    );

    if (!nonEmpty(ghEnvSecrets.SUPABASE_PROJECT_REF || "")) {
      fail("missing SUPABASE_PROJECT_REF for GitHub environment secrets.");
    }
    if (!nonEmpty(ghEnvSecrets.SUPABASE_ACCESS_TOKEN || "")) {
      fail("missing SUPABASE_ACCESS_TOKEN for GitHub environment secrets.");
    }
    if (
      !nonEmpty(ghEnvSecrets.SUPABASE_DB_URL || "") &&
      !nonEmpty(ghEnvSecrets.SUPABASE_DB_PASSWORD || "")
    ) {
      fail(
        "missing SUPABASE_DB_URL (preferred) or SUPABASE_DB_PASSWORD for GitHub environment secrets.",
      );
    }

    const ghEnvFile = writeTempEnvFile(`gh-${args.environment}`, ghEnvSecrets);
    run(
      "gh",
      [
        "secret",
        "set",
        "--app",
        "actions",
        "--repo",
        repo,
        "--env",
        args.environment,
        "--env-file",
        ghEnvFile.file,
      ],
      {
        description: `Setting GitHub Actions environment secrets for ${args.environment}...`,
        dryRun: args.dryRun,
      },
    );

    // Repo-level secrets used by CI jobs (non environment-scoped jobs)
    const ghRepoSecrets = Object.fromEntries(
      GH_REPO_KEYS.map(key => [key, getValue(key)]).filter(([, value]) => nonEmpty(value)),
    );
    const deployEnableKey =
      args.environment === "staging" ? "STAGING_DEPLOY_ENABLED" : "PRODUCTION_DEPLOY_ENABLED";
    const deployCommandKey =
      args.environment === "staging" ? "STAGING_DEPLOY_COMMAND" : "PRODUCTION_DEPLOY_COMMAND";
    const deployEnableValue = getValue(deployEnableKey) || "true";
    const deployCommandValue = getValue(deployCommandKey);
    if (!nonEmpty(deployCommandValue)) {
      fail(`missing ${deployCommandKey} in env source.`);
    }
    ghRepoSecrets[deployEnableKey] = deployEnableValue;
    ghRepoSecrets[deployCommandKey] = deployCommandValue;

    const ghRepoFile = writeTempEnvFile("gh-repo", ghRepoSecrets);
    run(
      "gh",
      ["secret", "set", "--app", "actions", "--repo", repo, "--env-file", ghRepoFile.file],
      {
        description: "Setting GitHub Actions repository secrets (CI + deploy gating)...",
        dryRun: args.dryRun,
      },
    );
  }

  // Supabase edge function secrets
  if (!args.skipSupabase) {
    const supabaseSecrets = Object.fromEntries(
      SUPABASE_EDGE_KEYS.map(key => [key, getValue(key)]).filter(([, value]) => nonEmpty(value)),
    );
    if (Object.keys(supabaseSecrets).length === 0) {
      fail("no Supabase edge secrets found in env source.");
    }

    const supabaseFile = writeTempEnvFile("supabase-edge", supabaseSecrets);
    run(
      "npx",
      ["supabase", "secrets", "set", "--project-ref", projectRef, "--env-file", supabaseFile.file],
      {
        description: `Setting Supabase edge function secrets for ${projectRef}...`,
        dryRun: args.dryRun,
      },
    );
  }

  console.log("\n[secrets-provision] Done.");
}

main();
