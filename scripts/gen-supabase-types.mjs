import "dotenv/config";
import { writeFileSync } from "node:fs";
import {
  genArgsForDbUrl,
  genArgsForLocal,
  genArgsForProjectId,
  isNonEmptyTypesOutput,
  normalizeNewlines,
  pickSupabaseBin,
  resolveDbUrlFromEnv,
  resolveProjectIdFromEnvOrConfig,
  run,
  typesPath,
} from "./supabase-types-utils.mjs";

function fail(msg, stderr) {
  if (msg) process.stderr.write(`${msg}\n`);
  if (stderr) process.stderr.write(String(stderr));
  process.exit(1);
}

const supabaseBin = pickSupabaseBin();
const explicitMode = String(process.env.SUPABASE_TYPES_MODE || "").trim().toLowerCase();
const dbUrl = resolveDbUrlFromEnv();
const projectId = resolveProjectIdFromEnvOrConfig();

// Generation order:
// - If SUPABASE_TYPES_MODE explicitly set, honor it.
// - Else prefer DB_URL (no docker; no access token needed).
// - Else try local (fast if available).
// - Else try project-id (requires SUPABASE_ACCESS_TOKEN).
const attempts = [];
if (explicitMode) {
  attempts.push(explicitMode);
} else if (dbUrl) {
  attempts.push("db-url");
} else {
  attempts.push("local", "project-id");
}

let lastErr = null;
for (const mode of attempts) {
  if (mode === "db-url") {
    if (!dbUrl) continue;
    const res = run(supabaseBin, genArgsForDbUrl(dbUrl));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from db-url to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  if (mode === "local") {
    const res = run(supabaseBin, genArgsForLocal());
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from local Supabase to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  if (mode === "project-id") {
    if (!projectId) {
      lastErr = { stderr: "[db:types] Missing SUPABASE_PROJECT_ID and supabase/config.toml project_id\n" };
      continue;
    }
    const res = run(supabaseBin, genArgsForProjectId(projectId));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      writeFileSync(typesPath, normalizeNewlines(res.stdout).trimEnd() + "\n", "utf8");
      process.stdout.write(`[db:types] Wrote types from project-id to ${typesPath}\n`);
      process.exit(0);
    }
    lastErr = res;
    continue;
  }

  lastErr = { stderr: `[db:types] Unknown mode: ${mode}\n` };
}

fail(
  "[db:types] Failed to generate Supabase types.\n" +
    "Set one of:\n" +
    "- SUPABASE_DB_URL (or DATABASE_URL) (recommended for CI/remote)\n" +
    "- SUPABASE_ACCESS_TOKEN (for --project-id generation; set SUPABASE_PROJECT_REF/ID)\n" +
    "- Or run local Supabase with Docker and use --local\n",
  lastErr?.stderr,
);

