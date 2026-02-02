import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(new URL(".", import.meta.url).pathname, "..");
const supabaseDir = resolve(repoRoot, "supabase");
const functionsDir = resolve(supabaseDir, "functions");
const configTomlPath = resolve(supabaseDir, "config.toml");
const outDir = resolve(repoRoot, "docs", "api");
const outPath = resolve(outDir, "swagger.json");

function listFunctionNames() {
  const entries = readdirSync(functionsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => name !== "tsconfig.json")
    .sort();
}

function parseVerifyJwtByFunction() {
  const raw = readFileSync(configTomlPath, "utf8");
  const lines = raw.split(/\r?\n/);

  /** @type {Record<string, boolean>} */
  const map = {};

  let current = null;
  for (const line of lines) {
    const hdr = line.match(/^\[functions\.([^\]]+)\]\s*$/);
    if (hdr) {
      current = hdr[1]?.trim() || null;
      continue;
    }
    if (!current) continue;
    const m = line.match(/^\s*verify_jwt\s*=\s*(true|false)\s*$/);
    if (m) {
      map[current] = m[1] === "true";
    }
  }

  return map;
}

const functionNames = listFunctionNames();
const verifyJwt = parseVerifyJwtByFunction();

const bearerAuth = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
};

/** @type {Record<string, any>} */
const paths = {};

for (const name of functionNames) {
  const requiresJwt = verifyJwt[name] !== false; // default secure

  paths[`/functions/v1/${name}`] = {
    post: {
      operationId: name.replace(/[^a-zA-Z0-9_]/g, "_"),
      summary: `Supabase Edge Function: ${name}`,
      tags: ["edge-functions"],
      ...(requiresJwt ? { security: [{ bearerAuth: [] }] } : {}),
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object", additionalProperties: true },
          },
        },
      },
      responses: {
        200: { description: "OK" },
        400: { description: "Bad Request" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        500: { description: "Server Error" },
      },
    },
  };
}

const spec = {
  openapi: "3.0.3",
  info: {
    title: "MorphoScan / Supabase Edge Functions",
    version: "0.1.0",
    description:
      "Auto-generated minimal OpenAPI spec for Supabase Edge Functions (invoke via /functions/v1/*).",
  },
  servers: [
    {
      url: "https://{projectRef}.supabase.co",
      variables: {
        projectRef: { default: "YOUR_PROJECT_REF" },
      },
    },
  ],
  tags: [{ name: "edge-functions" }],
  components: { securitySchemes: { bearerAuth } },
  paths,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
process.stdout.write(`[openapi] Wrote ${outPath}\n`);
