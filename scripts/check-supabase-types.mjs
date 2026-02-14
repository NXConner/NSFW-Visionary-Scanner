import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  genArgsForDbUrl,
  genArgsForLocal,
  genArgsForProjectId,
  isLocalSupabaseRunning,
  isNonEmptyTypesOutput,
  normalizeNewlines,
  pickSupabaseBin,
  resolveDbUrlFromEnv,
  resolveProjectIdFromEnvOrConfig,
  run,
  typesPath,
} from "./supabase-types-utils.mjs";

function normalize(s) {
  return normalizeNewlines(s).trimEnd() + "\n";
}

function fail(msg, stderr) {
  if (msg) process.stderr.write(`${msg}\n`);
  if (stderr) process.stderr.write(String(stderr));
  process.exit(1);
}

const supabaseBin = pickSupabaseBin();
const explicitMode = String(process.env.SUPABASE_TYPES_MODE || "").trim().toLowerCase();
const dbUrl = resolveDbUrlFromEnv();
const projectId = resolveProjectIdFromEnvOrConfig();

// Prefer the same order as db:types so CI/local workflows match:
// - explicit mode if set
// - db-url if available (best for CI/remote)
// - local (CI job runs Supabase locally)
// - project-id (requires SUPABASE_ACCESS_TOKEN)
const attempts = [];
if (explicitMode) {
  attempts.push(explicitMode);
} else if (dbUrl) {
  attempts.push("db-url");
} else {
  attempts.push("local", "project-id");
}

let lastErr = null;
let generated = null;

for (const mode of attempts) {
  if (mode === "db-url") {
    if (!dbUrl) continue;
    const res = run(supabaseBin, genArgsForDbUrl(dbUrl));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      generated = res.stdout;
      break;
    }
    lastErr = res;
    continue;
  }

  if (mode === "local") {
    if (!isLocalSupabaseRunning(supabaseBin)) {
      lastErr = {
        stderr:
          "[types-check] Supabase local stack is not running.\n" +
          "Start it with `npm run db:start` (requires Docker), or set SUPABASE_DB_URL/DATABASE_URL.\n",
      };
      continue;
    }

    const res = run(supabaseBin, genArgsForLocal());
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      generated = res.stdout;
      break;
    }
    lastErr = res;
    continue;
  }

  if (mode === "project-id") {
    if (!projectId) {
      lastErr = {
        stderr:
          "[types-check] Missing project ref.\n" +
          "Set SUPABASE_PROJECT_REF (or SUPABASE_PROJECT_ID) or ensure supabase/config.toml has project_id.\n",
      };
      continue;
    }

    const res = run(supabaseBin, genArgsForProjectId(projectId));
    if (res.status === 0 && isNonEmptyTypesOutput(res.stdout)) {
      generated = res.stdout;
      break;
    }
    lastErr = res;
    continue;
  }

  lastErr = { stderr: `[types-check] Unknown mode: ${mode}\n` };
}

if (!generated) {
  fail(
    "[types-check] Failed to generate Supabase types for comparison.\n" +
      "Provide one of:\n" +
      "- SUPABASE_DB_URL (or DATABASE_URL)\n" +
      "- Or start local Supabase with Docker (npm run db:start)\n" +
      "- Or set SUPABASE_ACCESS_TOKEN (for --project-id)\n",
    lastErr?.stderr,
  );
}

const current = readFileSync(typesPath, "utf8");
if (normalize(current) !== normalize(generated)) {
  process.stderr.write(
    "[types-check] `src/integrations/supabase/types.ts` is out of date.\n" +
      "Run `npm run db:types` and commit the result.\n",
  );
  process.exit(1);
}

process.stdout.write("[types-check] Supabase types are up to date.\n");
