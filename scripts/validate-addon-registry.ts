import { createClient } from "@supabase/supabase-js";
import { ADDON_MANIFESTS } from "../src/addons/manifestRegistry";

type Row = {
  addon_id: string;
  addon_name: string;
  addon_description: string;
  is_active: boolean | null;
  category: string | null;
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function ok(payload: unknown) {
  console.log(JSON.stringify({ ok: true, payload }, null, 2));
}

function fail(message: string, details?: unknown): never {
  console.error(JSON.stringify({ ok: false, message, details }, null, 2));
  process.exit(1);
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("premium_add_ons")
    .select("addon_id,addon_name,addon_description,is_active,category");
  if (error) fail("Failed to read premium_add_ons", { error: error.message });

  const db = (data || []) as Row[];
  const dbIds = new Set(db.map(r => r.addon_id));
  const codeIds = new Set(ADDON_MANIFESTS.map(m => m.id));

  const missingInDb = Array.from(codeIds)
    .filter(id => !dbIds.has(id))
    .sort();
  const extraInDb = Array.from(dbIds)
    .filter(id => !codeIds.has(id))
    .sort();

  const mismatches: Array<{ id: string; fields: Record<string, { db: unknown; code: unknown }> }> =
    [];

  for (const manifest of ADDON_MANIFESTS) {
    const row = db.find(r => r.addon_id === manifest.id);
    if (!row) continue;
    const fields: Record<string, { db: unknown; code: unknown }> = {};

    const dbName = normalizeText(row.addon_name);
    const codeName = normalizeText(manifest.name);
    if (dbName && codeName && dbName !== codeName) {
      fields.addon_name = { db: row.addon_name, code: manifest.name };
    }

    const dbDesc = normalizeText(row.addon_description);
    const codeDesc = normalizeText(manifest.description);
    if (dbDesc && codeDesc && dbDesc !== codeDesc) {
      fields.addon_description = { db: row.addon_description, code: manifest.description };
    }

    if (Object.keys(fields).length > 0) {
      mismatches.push({ id: manifest.id, fields });
    }
  }

  if (missingInDb.length || mismatches.length) {
    fail("Addon registry drift detected (DB vs code)", { missingInDb, mismatches, extraInDb });
  }

  ok({
    checked: { dbCount: db.length, codeCount: codeIds.size },
    missingInDb,
    extraInDb,
    mismatches,
  });
}

main().catch(e => fail(e instanceof Error ? e.message : "Unknown error"));
