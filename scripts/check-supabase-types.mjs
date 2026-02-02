import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL(".", import.meta.url).pathname, "..");
const typesPath = resolve(repoRoot, "src", "integrations", "supabase", "types.ts");

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return res;
}

function normalize(s) {
  return String(s).replace(/\r\n/g, "\n").trimEnd() + "\n";
}

// Ensure local Supabase stack is running; otherwise type generation may fail.
const status = run("npx", ["supabase", "status"]);
if (status.status !== 0) {
  process.stderr.write(status.stderr || "");
  process.stderr.write(
    "\n[types-check] Supabase local stack is not running. Start it with `npm run db:start`.\n",
  );
  process.exit(1);
}

const gen = run("npx", ["supabase", "gen", "types", "typescript", "--local"]);
if (gen.status !== 0) {
  process.stderr.write(gen.stderr || "");
  process.stderr.write("\n[types-check] Failed to generate Supabase types from local schema.\n");
  process.exit(gen.status ?? 1);
}

const current = readFileSync(typesPath, "utf8");
const generated = gen.stdout;

if (normalize(current) !== normalize(generated)) {
  process.stderr.write(
    "[types-check] `src/integrations/supabase/types.ts` is out of date.\n" +
      "Run `npm run db:types` (with local Supabase running) and commit the result.\n",
  );
  process.exit(1);
}

process.stdout.write("[types-check] Supabase types are up to date.\n");
