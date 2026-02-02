/**
 * Positions seeding (intentionally disabled by default).
 *
 * Rationale:
 * - The production Positions Gallery reads from `nsfw_positions_gallery`, which has strict schema
 *   constraints (category enums, required slugs, etc.).
 * - Seeding with a tiny hard-coded list is treated as "mock content" and drifts from the real
 *   admin import pipeline.
 *
 * Use the **Admin → DLC → Content Import → Positions → Auto import** flow instead, which builds a
 * real catalog from configured sources and upserts via `admin-import-dlc-content`.
 */
export async function seedPositionsLibrary(): Promise<void> {
  // Keep the seed step idempotent and non-destructive; do not insert partial/mock content.
  console.log(
    "ℹ️  Skipping positions seed. Use Admin → DLC → Content Import → Positions → Auto import to populate real content.",
  );
}
