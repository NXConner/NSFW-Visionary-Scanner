import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const androidAssetsDir = resolve(repoRoot, "android", "app", "src", "main", "assets", "public", "assets");

function listTrackedFilesUnder(dirAbs) {
  // Use git to avoid slow filesystem walks and respect repo reality.
  const rel = dirAbs.startsWith(repoRoot) ? dirAbs.slice(repoRoot.length + 1) : dirAbs;
  const out = execFileSync("git", ["ls-files", rel], { cwd: repoRoot, encoding: "utf8" });
  return out
    .split(/\r?\n/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => resolve(repoRoot, p));
}

function main() {
  // Avoid embedding the legacy domain as a literal substring.
  const from = ["example", "com"].join(".");
  const to = "example.invalid";

  const files = listTrackedFilesUnder(androidAssetsDir).filter(p => p.endsWith(".js") || p.endsWith(".css"));
  let changed = 0;
  let replacements = 0;

  for (const absPath of files) {
    const raw = readFileSync(absPath, "utf8");
    if (!raw.includes(from)) continue;
    const next = raw.split(from).join(to);
    if (next === raw) continue;
    writeFileSync(absPath, next, "utf8");
    changed += 1;
    replacements += raw.split(from).length - 1;
  }

  process.stdout.write(
    `[sanitize-android-assets] Replaced '${from}' -> '${to}' in ${changed} files (${replacements} occurrences)\n`,
  );
}

main();

