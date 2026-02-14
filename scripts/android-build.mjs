import { spawnSync } from "node:child_process";
import process from "node:process";

function run(command, args, options) {
  const res = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

const androidDir = new URL("../android/", import.meta.url);
const cwd = androidDir.pathname;

const isWin = process.platform === "win32";

const argv = new Set(process.argv.slice(2));
const wantsClean = !argv.has("--no-clean");

const wantsDebug = argv.has("--debug");
const wantsRelease = argv.has("--release");
const wantsBoth = argv.has("--both");

const buildBoth = wantsBoth || (wantsDebug && wantsRelease) || (!wantsDebug && !wantsRelease);
const buildDebug = buildBoth || wantsDebug;
const buildRelease = buildBoth || wantsRelease;

const tasks = [];
if (wantsClean) tasks.push("clean"); // removes old APKs before rebuilding
if (buildDebug) tasks.push("assembleDebug");
if (buildRelease) tasks.push("assembleRelease");

// Prefer deterministic CI-friendly builds
const gradleArgs = ["--no-daemon", ...tasks];

if (isWin) {
  // gradlew.bat requires cmd.exe on Windows.
  run("cmd.exe", ["/c", "gradlew.bat", ...gradleArgs], { cwd });
} else {
  // Linux/macOS: invoke via sh to avoid exec-bit issues.
  run("sh", ["./gradlew", ...gradleArgs], { cwd });
}

