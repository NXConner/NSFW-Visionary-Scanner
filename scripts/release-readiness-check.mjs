#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
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
const reportFileArg = (() => {
  const inline = args.find(arg => arg.startsWith("--report-file="));
  if (inline) return inline.slice("--report-file=".length);
  const index = args.findIndex(arg => arg === "--report-file");
  if (index >= 0 && index + 1 < args.length) return args[index + 1];
  return "release-readiness-report.json";
})();
const shouldWriteReport = !args.includes("--no-report");

const checks = [];

const readFile = filePath => {
  try {
    return fs.readFileSync(path.resolve(repoRoot, filePath), "utf8");
  } catch {
    return "";
  }
};

const exists = filePath => fs.existsSync(path.resolve(repoRoot, filePath));

const listFiles = (dirPath, fileExt) => {
  const absolute = path.resolve(repoRoot, dirPath);
  if (!fs.existsSync(absolute)) return [];
  const out = [];
  const stack = [absolute];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
      } else if (!fileExt || entry.name.endsWith(fileExt)) {
        out.push(next);
      }
    }
  }
  return out;
};

const run = (command, commandArgs) =>
  spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const isTracked = filePath => run("git", ["ls-files", "--error-unmatch", filePath]).status === 0;

const addCheck = ({ section, key, severity = "error", passed, message, details = "" }) => {
  checks.push({ section, key, severity, passed, message, details });
  const icon = passed ? "✅" : severity === "error" ? "❌" : "⚠️";
  const color = passed ? COLORS.green : severity === "error" ? COLORS.red : COLORS.yellow;
  const suffix = details ? ` (${details})` : "";
  console.log(`${color}${icon} [${section}] ${message}${suffix}${COLORS.reset}`);
};

const checkContains = (section, source, needle, message, severity = "error") => {
  addCheck({
    section,
    key: `${section}:${needle}`,
    severity,
    passed: source.includes(needle),
    message,
    details: `expected "${needle}"`,
  });
};

console.log(`${COLORS.cyan}🔎 MorphoScan release readiness audit${COLORS.reset}`);
console.log(`${COLORS.cyan}Repo: ${repoRoot}${COLORS.reset}\n`);

// P0: Secrets + environment hardening
const gitignore = readFile(".gitignore");
const requiredIgnorePatterns = [
  ".env",
  "android/app/google-services.json",
  "ios/App/App/GoogleService-Info.plist",
  "android/gradle.properties",
];

for (const pattern of requiredIgnorePatterns) {
  checkContains(
    "P0-SECRETS",
    gitignore,
    pattern,
    `.gitignore contains ${pattern}`,
    "error",
  );
}

const sensitivePaths = [
  ".env",
  "android/app/google-services.json",
  "ios/App/App/GoogleService-Info.plist",
  "android/gradle.properties",
];
for (const filePath of sensitivePaths) {
  const severity = filePath === "android/gradle.properties" ? "warning" : "error";
  const tracked = isTracked(filePath);
  if (filePath === "android/gradle.properties" && tracked) {
    const gradleProps = readFile(filePath);
    const hasSecretLikeLines =
      /(^|\n)\s*(RELEASE_|MORPHOSCAN_|storePassword|keyPassword|storeFile|keyAlias)\s*=/i.test(
        gradleProps,
      );
    if (!hasSecretLikeLines) {
      addCheck({
        section: "P0-SECRETS",
        key: `tracked:${filePath}`,
        passed: true,
        severity: "warning",
        message: `${filePath} is tracked but contains only non-secret defaults`,
      });
      continue;
    }
  }
  addCheck({
    section: "P0-SECRETS",
    key: `tracked:${filePath}`,
    passed: !tracked,
    severity,
    message: `${filePath} is not tracked by git`,
  });
}

const envExample = readFile(".env.example");
const requiredEnvKeys = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_APP_ENV",
  "VITE_APP_VERSION",
  "VITE_DISTRIBUTION_CHANNEL",
  "VITE_CLIENT_ENCRYPTION_SALT",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "FIREBASE_SERVICE_ACCOUNT",
  "APNS_KEY_P8",
  "APNS_KEY_ID",
  "APNS_TEAM_ID",
  "APNS_BUNDLE_ID",
];
for (const key of requiredEnvKeys) {
  checkContains("P0-SECRETS", envExample, `${key}=`, `.env.example defines ${key}`, "error");
}

const pwaRegister = readFile("src/pwa/register.ts");
checkContains(
  "P0-SWITCHES",
  pwaRegister,
  "if (import.meta.env.DEV) return;",
  "PWA registration is disabled in development",
);
checkContains(
  "P0-SWITCHES",
  pwaRegister,
  "if (isNativeApp()) return;",
  "PWA registration is disabled for native shells",
);
checkContains(
  "P0-SWITCHES",
  pwaRegister,
  "if (isPreviewHost()) return;",
  "PWA registration is disabled on preview hosts",
);

const capacitorConfigPath = "capacitor.config.json";
if (exists(capacitorConfigPath)) {
  try {
    const capacitorConfig = JSON.parse(readFile(capacitorConfigPath));
    addCheck({
      section: "P0-SWITCHES",
      key: "capacitor-server-url",
      passed: !capacitorConfig?.server?.url,
      severity: "error",
      message: "Capacitor production config has no dev server URL override",
    });
    addCheck({
      section: "P0-SWITCHES",
      key: "capacitor-debugging",
      passed: capacitorConfig?.android?.webContentsDebuggingEnabled !== true,
      severity: "error",
      message: "Android WebView debugging is disabled by default",
    });
    addCheck({
      section: "P0-SWITCHES",
      key: "capacitor-cleartext",
      passed: capacitorConfig?.server?.cleartext === false,
      severity: "error",
      message: "Capacitor cleartext traffic is disabled",
    });
  } catch (error) {
    addCheck({
      section: "P0-SWITCHES",
      key: "capacitor-config-parse",
      passed: false,
      severity: "error",
      message: "Capacitor config JSON parses successfully",
      details: error instanceof Error ? error.message : "parse error",
    });
  }
}

// P0: Supabase readiness
const migrationFiles = listFiles("supabase/migrations", ".sql");
addCheck({
  section: "P0-SUPABASE",
  key: "migration-count",
  passed: migrationFiles.length > 0,
  severity: "error",
  message: "Supabase migrations are present",
  details: `${migrationFiles.length} files`,
});
addCheck({
  section: "P0-SUPABASE",
  key: "nsfw-consent-migration",
  passed: exists("supabase/migrations/20260201090000_nsfw_consent_policies.sql"),
  severity: "error",
  message: "NSFW consent migration exists",
});

const requiredSupabaseFunctions = [
  "supabase/functions/delete-user-account/index.ts",
  "supabase/functions/data-retention-cleanup/index.ts",
  "supabase/functions/stripe-webhook/index.ts",
  "supabase/functions/create-dlc-checkout-session/index.ts",
  "supabase/functions/get-dlc-signed-url/index.ts",
  "supabase/functions/verify-dlc-license/index.ts",
  "supabase/functions/send-push-notification/index.ts",
  "supabase/functions/admin-import-dlc-content/index.ts",
  "supabase/functions/admin-rollback-dlc-import/index.ts",
];
for (const fnPath of requiredSupabaseFunctions) {
  addCheck({
    section: "P0-SUPABASE",
    key: `function:${fnPath}`,
    passed: exists(fnPath),
    severity: "error",
    message: `${fnPath} exists`,
  });
}

for (const docPath of [
  "docs/security/baseline/SECURITY_BASELINE.md",
  "docs/security/rls/RLS_AUDIT_CHECKLIST.md",
  "docs/security/rls/RLS_STORAGE_AUDIT_QUERIES.sql",
]) {
  addCheck({
    section: "P0-SUPABASE",
    key: `doc:${docPath}`,
    passed: exists(docPath),
    severity: "error",
    message: `${docPath} exists`,
  });
}

const sourceRouteFiles = [
  ...listFiles("src", ".ts"),
  ...listFiles("src", ".tsx"),
  ...listFiles("src", ".js"),
  ...listFiles("src", ".jsx"),
];
const hasNsfwAdminRouteRef = sourceRouteFiles.some(filePath => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes("/admin/nsfw") || content.includes("admin/nsfw");
  } catch {
    return false;
  }
});
addCheck({
  section: "P0-NSFW",
  key: "admin-nsfw-route",
  passed: hasNsfwAdminRouteRef,
  severity: "warning",
  message: "Admin NSFW route references exist in source",
});
addCheck({
  section: "P0-NSFW",
  key: "nsfw-hardening-doc",
  passed: exists("docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md"),
  severity: "error",
  message: "NSFW DLC hardening checklist document exists",
});

// P1: CI/CD and observability
const ciWorkflow = readFile(".github/workflows/ci.yml");
checkContains("P1-CICD", ciWorkflow, "STAGING_DEPLOY_ENABLED", "CI has staging deploy gating secret");
checkContains("P1-CICD", ciWorkflow, "STAGING_DEPLOY_COMMAND", "CI has staging deploy command secret");
checkContains(
  "P1-CICD",
  ciWorkflow,
  "PRODUCTION_DEPLOY_ENABLED",
  "CI has production deploy gating secret",
);
checkContains(
  "P1-CICD",
  ciWorkflow,
  "PRODUCTION_DEPLOY_COMMAND",
  "CI has production deploy command secret",
);
checkContains("P1-CICD", ciWorkflow, "github/codeql-action/init", "CI includes CodeQL scan");
checkContains("P1-CICD", ciWorkflow, "npm run scan:vuln", "CI runs dependency vulnerability scan");

const manualDeploy = readFile(".github/workflows/manual-deploy.yml");
checkContains("P1-CICD", manualDeploy, "workflow_dispatch", "Manual deploy workflow is dispatchable");
checkContains("P1-CICD", manualDeploy, "run_migrations", "Manual deploy supports migration apply step");
checkContains(
  "P1-CICD",
  manualDeploy,
  "deploy_edge_functions",
  "Manual deploy supports edge function deployment",
);
checkContains("P1-CICD", manualDeploy, "ref:", "Manual deploy supports rollback by git ref");

const externalRunbook = readFile("docs/operations/EXTERNAL_RELEASE_TASKS_RUNBOOK.md");
checkContains("P1-CICD", externalRunbook, "Rollback", "Runbook documents rollback procedures", "warning");

const sentry = readFile("src/lib/sentry.ts");
checkContains("P1-OBSERVABILITY", sentry, "sendDefaultPii: false", "Sentry PII default sending is disabled");
checkContains("P1-OBSERVABILITY", sentry, "beforeSend", "Sentry event scrubbing hook is configured");
checkContains(
  "P1-OBSERVABILITY",
  sentry,
  "distribution_channel",
  "Sentry tags include distribution channel",
  "warning",
);
const logger = readFile("src/lib/logger.ts");
checkContains("P1-OBSERVABILITY", logger, "DEFAULT_REDACT_KEYS", "Logger includes secret redaction keys");

// P2: Accessibility + performance
const packageJson = JSON.parse(readFile("package.json") || "{}");
const scripts = packageJson.scripts || {};
const devDependencies = packageJson.devDependencies || {};
addCheck({
  section: "P2-A11Y",
  key: "eslint-jsx-a11y",
  passed: Boolean(devDependencies["eslint-plugin-jsx-a11y"]),
  severity: "error",
  message: "eslint-plugin-jsx-a11y is configured",
});
for (const scriptName of [
  "a11y:audit",
  "perf:load",
  "perf:nsfw-media",
  "analyze:bundle",
  "release:env:validate",
  "release:remaining",
]) {
  addCheck({
    section: "P2-PERF",
    key: `script:${scriptName}`,
    passed: Boolean(scripts[scriptName]),
    severity: "error",
    message: `npm script "${scriptName}" exists`,
  });
}

for (const e2eSpec of ["e2e/auth.spec.ts", "e2e/core-flow.spec.ts", "e2e/pricing.spec.ts"]) {
  addCheck({
    section: "P2-A11Y",
    key: `e2e:${e2eSpec}`,
    passed: exists(e2eSpec),
    severity: "warning",
    message: `${e2eSpec} exists`,
  });
}
for (const perfTest of ["performance-tests/load-test.js", "performance-tests/nsfw-media-load-test.js"]) {
  addCheck({
    section: "P2-PERF",
    key: `perf:${perfTest}`,
    passed: exists(perfTest),
    severity: "error",
    message: `${perfTest} exists`,
  });
}
addCheck({
  section: "P2-PERF",
  key: "load-testing-doc",
  passed: exists("docs/guides/testing/LOAD_TESTING.md"),
  severity: "warning",
  message: "Load testing guide exists",
});

// P3: Mobile + store execution readiness (repo-side)
for (const mobileAsset of [
  "scripts/build-android-prod.sh",
  "scripts/build-ios-prod.sh",
  "docs/guides/build/MOBILE_BUILD_GUIDE.md",
  "android/app/build.gradle",
  "ios/App/App.xcodeproj/project.pbxproj",
]) {
  addCheck({
    section: "P3-MOBILE",
    key: `mobile:${mobileAsset}`,
    passed: exists(mobileAsset),
    severity: "warning",
    message: `${mobileAsset} exists`,
  });
}

// Optional NSFW hardening
for (const optionalPath of [
  "supabase/functions/get-dlc-key/index.ts",
  "supabase/functions/dlc-device-management/index.ts",
  "docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md",
]) {
  addCheck({
    section: "OPTIONAL-NSFW",
    key: `optional:${optionalPath}`,
    passed: exists(optionalPath),
    severity: "warning",
    message: `${optionalPath} exists`,
  });
}

const failedErrors = checks.filter(item => !item.passed && item.severity === "error");
const failedWarnings = checks.filter(item => !item.passed && item.severity === "warning");
const passed = checks.filter(item => item.passed);

const summary = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  total: checks.length,
  passed: passed.length,
  failedErrors: failedErrors.length,
  failedWarnings: failedWarnings.length,
  checks,
};

console.log("\n" + "-".repeat(72));
console.log(
  `${COLORS.green}Passed: ${passed.length}${COLORS.reset} | ${COLORS.red}Errors: ${failedErrors.length}${COLORS.reset} | ${COLORS.yellow}Warnings: ${failedWarnings.length}${COLORS.reset}`,
);

if (shouldWriteReport) {
  const reportAbsolutePath = path.resolve(repoRoot, reportFileArg);
  fs.mkdirSync(path.dirname(reportAbsolutePath), { recursive: true });
  fs.writeFileSync(reportAbsolutePath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`${COLORS.cyan}Report written: ${path.relative(repoRoot, reportAbsolutePath)}${COLORS.reset}`);
}

if (failedErrors.length > 0) {
  process.exit(1);
}
process.exit(0);
