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

if (isWin) {
  // gradlew.bat requires cmd.exe on Windows.
  run("cmd.exe", ["/c", "gradlew.bat", "assembleRelease"], { cwd });
} else {
  // Linux/macOS: invoke via sh to avoid exec-bit issues.
  run("sh", ["./gradlew", "assembleRelease"], { cwd });
}

