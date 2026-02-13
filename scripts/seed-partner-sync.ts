import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedPayload = {
  connections?: Array<Record<string, unknown>>;
  preferences?: Array<Record<string, unknown>>;
  permissions?: Array<Record<string, unknown>>;
  thoughtPings?: Array<Record<string, unknown>>;
  pingReactions?: Array<Record<string, unknown>>;
  positionSelections?: Array<Record<string, unknown>>;
  datePlans?: Array<Record<string, unknown>>;
  dateItinerary?: Array<Record<string, unknown>>;
  dateChecklist?: Array<Record<string, unknown>>;
  datePacking?: Array<Record<string, unknown>>;
  dateDistractions?: Array<Record<string, unknown>>;
  datePositions?: Array<Record<string, unknown>>;
  dateAftercare?: Array<Record<string, unknown>>;
  dateReminders?: Array<Record<string, unknown>>;
  dateReflections?: Array<Record<string, unknown>>;
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_FILE =
  process.env.PARTNER_SYNC_SEED_FILE || "scripts/seed/partner-sync-seed.json";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SEED_FILE) {
  throw new Error(
    "Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const resolved = path.resolve(SEED_FILE);
if (!fs.existsSync(resolved)) {
  throw new Error(`Seed file not found: ${resolved}`);
}

const raw = fs.readFileSync(resolved, "utf8");
const payload = JSON.parse(raw) as SeedPayload;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function upsert(table: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: "id",
  });
  if (error) throw error;
}

async function run() {
  await upsert("partner_connections", payload.connections ?? []);
  await upsert("partner_sync_preferences", payload.preferences ?? []);
  await upsert("partner_data_permissions", payload.permissions ?? []);
  await upsert("partner_thought_pings", payload.thoughtPings ?? []);
  await upsert("partner_thought_ping_reactions", payload.pingReactions ?? []);
  await upsert("partner_position_selections", payload.positionSelections ?? []);
  await upsert("intimate_date_proposals", payload.datePlans ?? []);
  await upsert("intimate_date_itinerary_items", payload.dateItinerary ?? []);
  await upsert("intimate_date_checklist_items", payload.dateChecklist ?? []);
  await upsert("intimate_date_packing_items", payload.datePacking ?? []);
  await upsert("intimate_date_distractions", payload.dateDistractions ?? []);
  await upsert("intimate_date_positions", payload.datePositions ?? []);
  await upsert("intimate_date_aftercare_items", payload.dateAftercare ?? []);
  await upsert("intimate_date_reminders", payload.dateReminders ?? []);
  await upsert("intimate_date_reflections", payload.dateReflections ?? []);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
