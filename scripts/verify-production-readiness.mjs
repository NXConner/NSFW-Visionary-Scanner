import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

function color(code, s) {
  return process.stdout.isTTY ? `\u001b[${code}m${s}\u001b[0m` : s;
}
const c = {
  cyan: s => color("36", s),
  yellow: s => color("33", s),
  green: s => color("32", s),
  red: s => color("31", s),
  gray: s => color("90", s),
};

const repoRoot = new URL("../", import.meta.url).pathname;
process.chdir(repoRoot);

const checks = { passed: [], failed: [], warnings: [] };

function checkItem(name, condition, severity = "error") {
  if (condition) {
    checks.passed.push(name);
    process.stdout.write(`  ${c.green("✅")} ${c.green(name)}\n`);
    return true;
  }

  if (severity === "warning") {
    checks.warnings.push(name);
    process.stdout.write(`  ${c.yellow("⚠️ ")} ${c.yellow(name)}\n`);
    return false;
  }

  checks.failed.push(name);
  process.stdout.write(`  ${c.red("❌")} ${c.red(name)}\n`);
  return false;
}

function safeReadText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function runOk(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isGitIgnored(path) {
  // `git check-ignore -q` returns 0 when ignored.
  return runOk("git", ["check-ignore", "-q", path]);
}

function runStep(name, cmd, args, severity = "error") {
  process.stdout.write(`>> ${c.cyan(name)}\n`);
  const ok = runOk(cmd, args);
  checkItem(name, ok, severity);
  return ok;
}

process.stdout.write(`\n${c.cyan("=== PRODUCTION READINESS VERIFICATION ===")}\n`);
process.stdout.write(`${c.gray(`Repo: ${repoRoot}`)}\n\n`);

// 1. Secrets Security
process.stdout.write(`${c.yellow("1. Secrets Security Check")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);

checkItem(".env file exists (local only)", existsSync(".env"), "warning");

const gitignore = safeReadText(".gitignore");
checkItem(".env pattern is in .gitignore", /\n\.env(\n|$)/.test(`\n${gitignore}\n`), "error");

checkItem("google-services.json is in .gitignore", isGitIgnored("android/app/google-services.json"), "error");
checkItem(
  "GoogleService-Info.plist is in .gitignore",
  isGitIgnored("ios/App/App/GoogleService-Info.plist"),
  "error",
);
checkItem(
  "android/gradle.properties.local is in .gitignore",
  isGitIgnored("android/gradle.properties.local"),
  "error",
);
checkItem("Keystore files (*.jks) are ignored", /\n\*\.jks(\n|$)/.test(`\n${gitignore}\n`), "error");
checkItem("Keystore files (*.keystore) are ignored", /\n\*\.keystore(\n|$)/.test(`\n${gitignore}\n`), "error");

// 2. Build System
process.stdout.write(`\n${c.yellow("2. Build System")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);

const distExists = existsSync("dist");
checkItem("Production build exists (dist folder)", distExists, "error");

if (distExists) {
  const indexHtml = existsSync("dist/index.html");
  checkItem("dist/index.html exists", indexHtml, "error");
  if (indexHtml) {
    const content = safeReadText("dist/index.html");
    checkItem("Build contains no localhost references", !/localhost/i.test(content), "error");
  }
}

// 3. Code Quality
process.stdout.write(`\n${c.yellow("3. Code Quality")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);
runStep("lint", "npm", ["run", "lint"], "warning");

// 4. Android Build
process.stdout.write(`\n${c.yellow("4. Android Build")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);

const gradleWrapperExists = existsSync("android/gradlew") || existsSync("android/gradlew.bat");
checkItem("Gradle wrapper exists", gradleWrapperExists, "warning");

const apkDir = "android/app/build/outputs/apk/release";
let apkFound = false;
let apkName = "";
let apkSizeMb = 0;
try {
  const fs = await import("node:fs");
  const files = existsSync(apkDir) ? fs.readdirSync(apkDir).filter(f => f.endsWith(".apk")) : [];
  if (files.length > 0) {
    apkFound = true;
    apkName = files[0] || "";
    const st = statSync(join(apkDir, apkName));
    apkSizeMb = Math.round((st.size / (1024 * 1024)) * 100) / 100;
  }
} catch {
  // ignore
}

if (apkFound) {
  checks.passed.push("APK built");
  process.stdout.write(`  ${c.green("✅")} ${c.green(`APK found: ${apkName} (${apkSizeMb} MB)`)}\n`);
} else {
  checkItem("APK built", false, "warning");
}

// 5. Documentation
process.stdout.write(`\n${c.yellow("5. Documentation")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);

checkItem("README.md exists", existsSync("README.md"), "error");
checkItem("LICENSE file exists", existsSync("LICENSE"), "error");
checkItem("CONTRIBUTING.md exists", existsSync("CONTRIBUTING.md"), "warning");

// 6. Environment Configuration
process.stdout.write(`\n${c.yellow("6. Environment Configuration")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);

const envExampleExists = existsSync(".env.example");
checkItem(".env.example exists", envExampleExists, "error");
if (envExampleExists) {
  const envExample = safeReadText(".env.example");
  const hasSupabaseUrl = /VITE_SUPABASE_URL/.test(envExample);
  const hasSupabaseKey = /VITE_SUPABASE_PUBLISHABLE_KEY/.test(envExample);
  checkItem(".env.example contains required variables", hasSupabaseUrl && hasSupabaseKey, "error");
}

// 7. Dependencies
process.stdout.write(`\n${c.yellow("7. Dependencies")}\n`);
process.stdout.write(`${c.cyan("-".repeat(40))}\n`);
runStep("npm audit (high)", "npm", ["run", "scan:vuln"], "warning");

// Summary
process.stdout.write(`\n${c.cyan("=== VERIFICATION SUMMARY ===")}\n\n`);
process.stdout.write(`${c.green(`✅ Passed: ${checks.passed.length}`)}\n`);
process.stdout.write(
  `${checks.failed.length === 0 ? c.green(`❌ Failed: ${checks.failed.length}`) : c.red(`❌ Failed: ${checks.failed.length}`)}\n`,
);
process.stdout.write(
  `${checks.warnings.length === 0 ? c.green(`⚠️  Warnings: ${checks.warnings.length}`) : c.yellow(`⚠️  Warnings: ${checks.warnings.length}`)}\n`,
);

if (checks.failed.length > 0) {
  process.stdout.write(`\n${c.red("❌ Failed Checks:")}\n`);
  for (const x of checks.failed) process.stdout.write(`  - ${c.red(x)}\n`);
}

if (checks.warnings.length > 0) {
  process.stdout.write(`\n${c.yellow("⚠️  Warnings:")}\n`);
  for (const x of checks.warnings) process.stdout.write(`  - ${c.yellow(x)}\n`);
}

process.stdout.write("\n");
if (checks.failed.length === 0) {
  process.stdout.write(`${c.green("✅ Production readiness checks passed!")}\n\n`);
  process.stdout.write(`${c.cyan("Next steps:")}\n`);
  process.stdout.write("  1. Set up production environment variables\n");
  process.stdout.write("  2. Configure Supabase production project\n");
  process.stdout.write("  3. Set up Stripe (if monetizing)\n");
  process.stdout.write("  4. Run production testing\n");
  process.exit(0);
}

process.stdout.write(`${c.red("❌ Some checks failed. Please address the issues above.")}\n`);
process.exit(1);

