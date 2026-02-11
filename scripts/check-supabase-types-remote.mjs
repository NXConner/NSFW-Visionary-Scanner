import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = resolve(new URL(".", import.meta.url).pathname, "..");
const typesPath = resolve(repoRoot, "src", "integrations", "supabase", "types.ts");

function normalize(s) {
  return String(s).replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function parseProjectId(args) {
  const arg = args.find(a => a.startsWith("--project-id=") || a.startsWith("--project-ref="));
  if (arg) {
    const [, raw] = arg.split("=", 2);
    return String(raw || "").trim();
  }
  const flagIdx = args.findIndex(a => a === "--project-id" || a === "--project-ref");
  if (flagIdx >= 0) return String(args[flagIdx + 1] || "").trim();
  return "";
}

const projectId =
  parseProjectId(process.argv.slice(2)) ||
  String(process.env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_ID || "").trim();

if (!projectId) {
  process.stderr.write(
    "[types-remote-check] Missing project id.\n" +
      "Set SUPABASE_PROJECT_REF (recommended) or pass --project-ref=<ref>.\n",
  );
  process.exit(1);
}

const gen = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  { encoding: "utf8" },
);

if (gen.status !== 0) {
  process.stderr.write(gen.stderr || "");
  process.stderr.write(
    "\n[types-remote-check] Failed to generate types from remote schema.\n" +
      "Ensure Supabase CLI is authenticated (SUPABASE_ACCESS_TOKEN or `supabase login`).\n",
  );
  process.exit(gen.status ?? 1);
}

const current = readFileSync(typesPath, "utf8");
const generated = gen.stdout || "";

if (normalize(current) !== normalize(generated)) {
  process.stderr.write(
    "[types-remote-check] `src/integrations/supabase/types.ts` does not match the remote schema.\n" +
      "Actions:\n" +
      `  - Confirm migrations are applied to project ${projectId}\n` +
      "  - If the remote schema is the source of truth, regenerate types locally and commit:\n" +
      `      npx supabase gen types typescript --project-id ${projectId} --schema public > src/integrations/supabase/types.ts\n`,
  );
  process.exit(1);
}

process.stdout.write("[types-remote-check] Supabase types match remote schema.\n");
