import { createClient } from "@supabase/supabase-js";
import { DLC_PACKAGES } from "../src/dlc/core/dlcRegistryParts/packages";

type Row = {
  package_id: string;
  is_active: boolean | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  price_usd: number | null;
  price_type: string | null;
  subscription_interval: string | null;
};

function envAny(names: string[]): string {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim().length > 0) return String(v).trim();
  }
  return "";
}

function ok(payload: unknown) {
  console.log(JSON.stringify({ ok: true, ...payload }, null, 2));
}

function fail(message: string, details?: unknown): never {
  console.error(JSON.stringify({ ok: false, message, details }, null, 2));
  process.exit(1);
}

async function main() {
  const argv = new Set(process.argv.slice(2));
  const offline = argv.has("--offline") || argv.has("--skip-db");
  const url = envAny(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  const key = envAny(["SUPABASE_SERVICE_ROLE_KEY"]);

  const codeIds = new Set(Object.keys(DLC_PACKAGES));

  if (offline || !url || !key) {
    ok({
      ok: true,
      mode: "offline",
      checked: { codeCount: codeIds.size },
      note: "DB drift validation skipped (set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to validate dlc_packages against code fallback).",
    });
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("dlc_packages")
    .select(
      "package_id,is_active,stripe_price_id,stripe_product_id,price_usd,price_type,subscription_interval",
    );
  if (error) fail("Failed to read dlc_packages", { error: error.message });

  const db = (data || []) as Row[];
  const dbIds = new Set(db.map(r => r.package_id));

  const missingInDb = Array.from(codeIds)
    .filter(id => !dbIds.has(id))
    .sort();
  const extraInDb = Array.from(dbIds)
    .filter(id => !codeIds.has(id))
    .sort();

  const mismatches: Array<{ id: string; fields: Record<string, { db: unknown; code: unknown }> }> =
    [];

  for (const id of Array.from(codeIds)) {
    const code = DLC_PACKAGES[id];
    const row = db.find(r => r.package_id === id);
    if (!row) continue;

    const fields: Record<string, { db: unknown; code: unknown }> = {};

    const codePriceUsd = typeof code?.priceUsd === "number" ? code.priceUsd : null;
    if (
      row.price_usd != null &&
      codePriceUsd != null &&
      Number(row.price_usd) !== Number(codePriceUsd)
    ) {
      fields.price_usd = { db: row.price_usd, code: codePriceUsd };
    }

    const codePriceType = typeof code?.priceType === "string" ? code.priceType : null;
    if (row.price_type && codePriceType && String(row.price_type) !== String(codePriceType)) {
      fields.price_type = { db: row.price_type, code: codePriceType };
    }

    const codeInterval =
      typeof code?.subscriptionInterval === "string" ? code.subscriptionInterval : null;
    if (
      row.subscription_interval &&
      codeInterval &&
      String(row.subscription_interval) !== String(codeInterval)
    ) {
      fields.subscription_interval = { db: row.subscription_interval, code: codeInterval };
    }

    if (Object.keys(fields).length > 0) mismatches.push({ id, fields });
  }

  if (missingInDb.length || mismatches.length) {
    fail("DLC catalog drift detected (DB vs code fallback)", {
      missingInDb,
      mismatches,
      extraInDb,
    });
  }

  ok({
    checked: { dbCount: db.length, codeCount: codeIds.size },
    missingInDb,
    extraInDb,
    mismatches,
  });
}

main().catch(e => fail(e instanceof Error ? e.message : "Unknown error"));
