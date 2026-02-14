/**
 * DLC seed (no-op)
 *
 * This repo's canonical DLC catalog is `public.dlc_packages` (plus Stripe mapping fields),
 * which is kept aligned via Supabase migrations.
 *
 * The legacy `dlc_packs` / `dlc_bundles` tables are not used by the current app runtime,
 * and seeding them creates "fake storefront" drift. Keep this step explicitly empty.
 *
 * To verify the canonical catalog:
 * - `npm run dlc:validate-catalog` (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */

export async function seedDLCPacks(): Promise<void> {
  console.log(
    "ℹ️  Skipping legacy dlc_packs seed; canonical catalog is in dlc_packages (migrations).",
  );
}

export async function seedDLCBundles(): Promise<void> {
  console.log(
    "ℹ️  Skipping legacy dlc_bundles seed; canonical catalog is in dlc_packages (migrations).",
  );
}
