#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
process.chdir(repoRoot);

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const args = process.argv.slice(2);

function parseArgs() {
  const has = flag => args.includes(flag);
  const read = (flag, fallback = "") => {
    const inline = args.find(arg => arg.startsWith(`${flag}=`));
    if (inline) return String(inline.slice(flag.length + 1)).trim();
    const index = args.findIndex(arg => arg === flag);
    if (index >= 0 && index + 1 < args.length) return String(args[index + 1] || "").trim();
    return fallback;
  };

  const environment = read("--environment", "staging").toLowerCase();
  const envFile = read("--env-file", "");
  const reportFile = read("--report-file", `artifacts/release-env-validation.${environment}.json`);

  return {
    environment,
    envFile,
    reportFile,
    monetized: has("--monetized"),
    requirePush: has("--require-push"),
    requireNsfw: has("--require-nsfw"),
    strictWarnings: has("--strict-warnings"),
    noReport: has("--no-report"),
  };
}

const options = parseArgs();
if (!["staging", "production"].includes(options.environment)) {
  console.error("[release-env-validate] --environment must be staging or production");
  process.exit(1);
}
if (!options.envFile) {
  console.error("[release-env-validate] missing --env-file");
  process.exit(1);
}

const envFilePath = path.isAbsolute(options.envFile)
  ? options.envFile
  : path.join(repoRoot, options.envFile);
if (!fs.existsSync(envFilePath)) {
  console.error(`[release-env-validate] env file not found: ${envFilePath}`);
  process.exit(1);
}

function parseDotEnv(dotEnvContent) {
  const out = {};
  const lines = String(dotEnvContent || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseDotEnv(fs.readFileSync(envFilePath, "utf8"));
const envPrefix = `${options.environment.toUpperCase()}_`;
const results = [];

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|api[_-]?key|private|service_role|webhook|keyring)/i;

const PLACEHOLDER_PATTERNS = [
  /^$/i,
  /^change[_-]?me$/i,
  /^replace[_-]?me$/i,
  /^your[_-]/i,
  /example/i,
  /<.*>/i,
  /\[YOUR-PASSWORD\]/i,
  /\[YOUR_PASSWORD\]/i,
  /your-project-ref/i,
  /YOUR_PROJECT_REF/i,
  /pk_test_REPLACE_ME/i,
  /sk_test_REPLACE_ME/i,
  /whsec_REPLACE_ME/i,
  /localhost(?::\d+)?/i,
];

function valueForKey(key) {
  const prefixed = env[`${envPrefix}${key}`] || process.env[`${envPrefix}${key}`];
  if (typeof prefixed === "string" && prefixed.trim().length > 0) return prefixed.trim();
  const plain = env[key] || process.env[key];
  if (typeof plain === "string" && plain.trim().length > 0) return plain.trim();
  return "";
}

function looksPlaceholder(value) {
  const trimmed = String(value || "").trim();
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(trimmed));
}

function maskValue(key, value) {
  if (!value) return "";
  if (SENSITIVE_KEY_PATTERN.test(key)) return `[REDACTED:${String(value).length}]`;
  if (String(value).length <= 48) return String(value);
  return `${String(value).slice(0, 24)}...${String(value).slice(-8)}`;
}

function addResult(section, key, severity, passed, message) {
  const value = valueForKey(key);
  const result = {
    section,
    key,
    severity,
    passed,
    message,
    valuePreview: maskValue(key, value),
    source: env[`${envPrefix}${key}`] ? `${envPrefix}${key}` : env[key] ? key : "missing",
  };
  results.push(result);

  const icon = passed ? "✅" : severity === "error" ? "❌" : "⚠️";
  const color = passed ? COLORS.green : severity === "error" ? COLORS.red : COLORS.yellow;
  console.log(
    `${color}${icon} [${section}] ${message}${result.valuePreview ? ` (${result.valuePreview})` : ""}${COLORS.reset}`,
  );
}

function requireKey(section, key, { severity = "error", validate } = {}) {
  const value = valueForKey(key);
  if (!value || looksPlaceholder(value)) {
    addResult(section, key, severity, false, `${key} is missing or placeholder`);
    return false;
  }
  if (typeof validate === "function") {
    const validationResult = validate(value);
    if (validationResult !== true) {
      addResult(section, key, severity, false, `${key} is invalid (${validationResult})`);
      return false;
    }
  }
  addResult(section, key, severity, true, `${key} is configured`);
  return true;
}

function requireOneOf(section, keys, { severity = "error" } = {}) {
  const winner = keys.find(key => {
    const value = valueForKey(key);
    return value && !looksPlaceholder(value);
  });
  if (!winner) {
    for (const key of keys) {
      addResult(section, key, severity, false, `${keys.join(" or ")} required`);
    }
    return false;
  }
  // When one key is present, the others are optional (do not emit failing results for them).
  // We still report them for visibility, but as passing checks.
  for (const key of keys) {
    const value = valueForKey(key);
    const isConfigured = Boolean(value && !looksPlaceholder(value));
    if (key === winner) {
      addResult(section, key, severity, true, `${key} is configured (selected)`);
      continue;
    }
    addResult(
      section,
      key,
      "warning",
      true,
      isConfigured ? `${key} is also configured (ok)` : `${key} is not set (ok)`,
    );
  }
  return true;
}

function validateUrl(value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:", "postgresql:", "postgres:"].includes(parsed.protocol)) {
      return "unsupported protocol";
    }
    return true;
  } catch {
    return "not a valid URL";
  }
}

function validateEnum(allowed) {
  return value => (allowed.includes(value) ? true : `expected one of ${allowed.join(", ")}`);
}

console.log(
  `${COLORS.cyan}🔐 Release environment validation (${options.environment})${COLORS.reset}`,
);
console.log(`${COLORS.cyan}Env file: ${path.relative(repoRoot, envFilePath)}${COLORS.reset}\n`);

// Core release + deploy keys
requireKey("CORE", "VITE_SUPABASE_URL", { validate: validateUrl });
requireKey("CORE", "VITE_SUPABASE_PUBLISHABLE_KEY");
requireKey("CORE", "SUPABASE_PROJECT_REF");
requireKey("CORE", "SUPABASE_ACCESS_TOKEN");
requireOneOf("CORE", ["SUPABASE_DB_URL", "SUPABASE_DB_PASSWORD"]);

requireKey("APP", "VITE_APP_ENV", {
  severity: "warning",
  validate: value =>
    value === options.environment || value === "production" || value === "staging"
      ? true
      : "expected staging or production",
});
requireKey("APP", "VITE_APP_VERSION", {
  severity: "warning",
  validate: validateEnum(["sfw", "nsfw", "hybrid"]),
});
requireKey("APP", "VITE_DISTRIBUTION_CHANNEL", {
  severity: "warning",
  validate: validateEnum(["store", "direct"]),
});

const deployEnableKey =
  options.environment === "staging" ? "STAGING_DEPLOY_ENABLED" : "PRODUCTION_DEPLOY_ENABLED";
const deployCommandKey =
  options.environment === "staging" ? "STAGING_DEPLOY_COMMAND" : "PRODUCTION_DEPLOY_COMMAND";

requireKey("DEPLOY", deployEnableKey, {
  validate: validateEnum(["true", "false"]),
});
const deployEnabledValue = valueForKey(deployEnableKey).toLowerCase();
requireKey("DEPLOY", deployCommandKey, {
  severity: deployEnabledValue === "true" ? "error" : "warning",
});

// Stripe checks (required if monetized)
const stripeSeverity = options.monetized ? "error" : "warning";
requireKey("STRIPE", "STRIPE_SECRET_KEY", { severity: stripeSeverity });
requireKey("STRIPE", "STRIPE_WEBHOOK_SECRET", { severity: stripeSeverity });
requireKey("STRIPE", "VITE_STRIPE_PUBLISHABLE_KEY", { severity: stripeSeverity });

const priceIdKeys = Array.from(
  new Set(
    [...Object.keys(env), ...Object.keys(process.env)].filter(key => key.endsWith("PRICE_ID")),
  ),
);
const validPriceIdKeys = priceIdKeys.filter(key => {
  const value = valueForKey(key);
  return value && !looksPlaceholder(value);
});
if (validPriceIdKeys.length > 0) {
  addResult(
    "STRIPE",
    "PRICE_IDS",
    "warning",
    true,
    `${validPriceIdKeys.length} price IDs configured`,
  );
} else {
  addResult(
    "STRIPE",
    "PRICE_IDS",
    stripeSeverity,
    false,
    "No non-placeholder PRICE_ID values found (required for monetized release)",
  );
}

// Push checks (required if --require-push)
const pushSeverity = options.requirePush ? "error" : "warning";
for (const key of [
  "FIREBASE_SERVICE_ACCOUNT",
  "APNS_KEY_P8",
  "APNS_KEY_ID",
  "APNS_TEAM_ID",
  "APNS_BUNDLE_ID",
]) {
  requireKey("PUSH", key, { severity: pushSeverity });
}

// NSFW checks (required if --require-nsfw)
const nsfwSeverity = options.requireNsfw ? "error" : "warning";
requireKey("NSFW", "NSFW_CONTENT_BUCKET", { severity: nsfwSeverity });
requireKey("NSFW", "DLC_KEYRING_MASTER_KEY_B64", { severity: nsfwSeverity });

const failedErrors = results.filter(item => !item.passed && item.severity === "error");
const failedWarnings = results.filter(item => !item.passed && item.severity === "warning");
const passed = results.filter(item => item.passed);

const summary = {
  generatedAt: new Date().toISOString(),
  environment: options.environment,
  envFile: path.relative(repoRoot, envFilePath),
  options: {
    monetized: options.monetized,
    requirePush: options.requirePush,
    requireNsfw: options.requireNsfw,
    strictWarnings: options.strictWarnings,
  },
  total: results.length,
  passed: passed.length,
  failedErrors: failedErrors.length,
  failedWarnings: failedWarnings.length,
  results,
};

if (!options.noReport) {
  const reportPath = path.isAbsolute(options.reportFile)
    ? options.reportFile
    : path.join(repoRoot, options.reportFile);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(
    `\n${COLORS.cyan}Report written: ${path.relative(repoRoot, reportPath)}${COLORS.reset}`,
  );
}

console.log(
  `\n${COLORS.green}Passed: ${passed.length}${COLORS.reset} | ${COLORS.red}Errors: ${failedErrors.length}${COLORS.reset} | ${COLORS.yellow}Warnings: ${failedWarnings.length}${COLORS.reset}`,
);

if (failedErrors.length > 0 || (options.strictWarnings && failedWarnings.length > 0)) {
  process.exit(1);
}
process.exit(0);
