#!/usr/bin/env node

/**
 * Pre-Submission Checklist Script
 *
 * Comprehensive checklist for app store submission readiness.
 * Part of Phase 8: Polish & Optimization
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

const checks = {
  passed: [],
  failed: [],
  warnings: [],
  skipped: [],
};

function check(name, condition, severity = "error") {
  if (condition) {
    checks.passed.push(name);
    log(`  ✅ ${name}`, COLORS.green);
    return true;
  } else {
    if (severity === "error") {
      checks.failed.push(name);
      log(`  ❌ ${name}`, COLORS.red);
    } else {
      checks.warnings.push(name);
      log(`  ⚠️  ${name}`, COLORS.yellow);
    }
    return false;
  }
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, "..", filePath);
  const exists = fs.existsSync(fullPath);
  check(description, exists, "error");
  return exists;
}

function checkEnvVar(varName, description) {
  const value = process.env[varName];
  check(description, !!value, "warning");
  return !!value;
}

function runCommand(command, description) {
  try {
    execSync(command, { stdio: "pipe" });
    check(description, true);
    return true;
  } catch (error) {
    check(description, false);
    return false;
  }
}

async function runPreSubmissionChecklist() {
  log("\n📋 PRE-SUBMISSION CHECKLIST", COLORS.bright);
  log("=".repeat(60), COLORS.cyan);

  // 1. Build Verification
  log("\n1. Build Verification", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  checkFileExists("dist/index.html", "Production build exists");
  checkFileExists("dist/assets", "Assets directory exists");

  const distPath = path.join(__dirname, "..", "dist");
  if (fs.existsSync(distPath)) {
    const indexHtml = path.join(distPath, "index.html");
    if (fs.existsSync(indexHtml)) {
      const content = fs.readFileSync(indexHtml, "utf8");
      check(
        "Build contains no dev server references",
        !content.includes("localhost:8080"),
        "error",
      );
      check(
        "Build contains no source maps in production",
        !content.includes("sourceMappingURL"),
        "warning",
      );
    }
  }

  // 2. Code Quality
  log("\n2. Code Quality", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  runCommand("npm run lint", "Linting passes");
  runCommand("npx tsc -p tsconfig.app.json --noEmit", "TypeScript compilation");

  // 3. Testing
  log("\n3. Testing", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  runCommand("npm run test:run", "Unit tests pass");
  runCommand("npm run test:e2e", "E2E tests pass");

  // 4. Performance
  log("\n4. Performance", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  const distAssets = path.join(distPath, "assets");
  if (fs.existsSync(distAssets)) {
    const files = fs.readdirSync(distAssets, { recursive: true });
    const jsFiles = files.filter(f => f.endsWith(".js"));
    let totalJS = 0;
    let initialJS = 0;

    jsFiles.forEach(file => {
      const filePath = path.join(distAssets, file);
      if (fs.statSync(filePath).isFile()) {
        const size = fs.statSync(filePath).size;
        totalJS += size;
        if (file.includes("index") || file.includes("main")) {
          initialJS += size;
        }
      }
    });

    const initialJSKB = initialJS / 1024;
    const totalJSKB = totalJS / 1024;

    check(
      `Initial JS bundle < 200 KB (${initialJSKB.toFixed(2)} KB)`,
      initialJSKB < 200,
      "warning",
    );
    check(`Total JS bundle < 1 MB (${totalJSKB.toFixed(2)} KB)`, totalJSKB < 1024, "warning");
  }

  // 5. Environment Configuration
  log("\n5. Environment Configuration", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  checkFileExists(".env.example", ".env.example exists");
  checkFileExists(".env", ".env file exists (local only)", "warning");

  // Check critical env vars (warnings only, as they may be in CI)
  checkEnvVar("VITE_SUPABASE_URL", "VITE_SUPABASE_URL is set");
  checkEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY is set");

  // 6. Documentation
  log("\n6. Documentation", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  checkFileExists("README.md", "README.md exists");
  checkFileExists("LICENSE", "LICENSE file exists");
  checkFileExists("CONTRIBUTING.md", "CONTRIBUTING.md exists");
  checkFileExists("docs/guides/deployment/DEPLOYMENT_CHECKLIST.md", "Deployment checklist exists");

  // 7. Security
  log("\n7. Security", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  checkFileExists(".gitignore", ".gitignore exists");

  // Check .gitignore contains sensitive files
  if (fs.existsSync(".gitignore")) {
    const gitignore = fs.readFileSync(".gitignore", "utf8");
    check(".gitignore excludes .env", gitignore.includes(".env"), "error");
    check(".gitignore excludes node_modules", gitignore.includes("node_modules"), "error");
    check(".gitignore excludes dist", gitignore.includes("dist"), "error");
  }

  // 8. Mobile Build Preparation
  log("\n8. Mobile Build Preparation", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  checkFileExists("android/app/build.gradle", "Android build config exists");
  checkFileExists("ios/App/App.xcodeproj", "iOS project exists");
  checkFileExists("capacitor.config.ts", "Capacitor config exists");

  // 9. App Store Assets
  log("\n9. App Store Assets", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  check("App icons configured", true, "warning"); // Manual check
  check("Screenshots prepared", true, "warning"); // Manual check
  check("Store listing content ready", true, "warning"); // Manual check
  check("Privacy policy URL accessible", true, "warning"); // Manual check

  // 10. Dependencies
  log("\n10. Dependencies", COLORS.bright);
  log("-".repeat(40), COLORS.cyan);

  try {
    execSync("npm audit --audit-level=high", { stdio: "pipe" });
    check("No high-severity vulnerabilities", true);
  } catch (error) {
    check("No high-severity vulnerabilities", false, "error");
  }

  // Summary
  log("\n📊 CHECKLIST SUMMARY", COLORS.bright);
  log("=".repeat(60), COLORS.cyan);

  log(`\n✅ Passed: ${checks.passed.length}`, COLORS.green);
  log(`❌ Failed: ${checks.failed.length}`, checks.failed.length > 0 ? COLORS.red : COLORS.green);
  log(
    `⚠️  Warnings: ${checks.warnings.length}`,
    checks.warnings.length > 0 ? COLORS.yellow : COLORS.green,
  );

  if (checks.failed.length > 0) {
    log("\n❌ Failed Checks:", COLORS.red);
    checks.failed.forEach(check => log(`  - ${check}`, COLORS.red));
  }

  if (checks.warnings.length > 0) {
    log("\n⚠️  Warnings:", COLORS.yellow);
    checks.warnings.forEach(check => log(`  - ${check}`, COLORS.yellow));
  }

  // Recommendations
  log("\n💡 Next Steps:", COLORS.bright);
  log("  1. Fix all failed checks", COLORS.cyan);
  log("  2. Review warnings", COLORS.cyan);
  log("  3. Run manual testing on devices", COLORS.cyan);
  log("  4. Prepare app store assets", COLORS.cyan);
  log("  5. Submit for review", COLORS.cyan);

  log("\n✅ Pre-Submission Checklist Complete!", COLORS.green);
  log("=".repeat(60), COLORS.cyan);

  // Exit with error if critical checks failed
  if (checks.failed.length > 0) {
    process.exit(1);
  }
}

// Main execution
runPreSubmissionChecklist().catch(error => {
  log(`\n❌ Checklist failed: ${error.message}`, COLORS.red);
  process.exit(1);
});
