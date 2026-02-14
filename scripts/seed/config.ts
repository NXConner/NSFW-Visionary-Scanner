import "dotenv/config";

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const ADMIN_EMAIL =
  process.env.ADMIN_SUPER_EMAIL ||
  process.env.VITE_ADMIN_SUPER_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  "";

export function assertSeedConfig() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
    process.exit(1);
  }
  if (!ADMIN_EMAIL) {
    console.error(
      "Missing ADMIN_SUPER_EMAIL (or VITE_ADMIN_SUPER_EMAIL/VITE_ADMIN_EMAIL) for seed.",
    );
    process.exit(1);
  }
}
