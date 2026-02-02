import "dotenv/config";

export const SEED_DEFAULT_ADMIN_EMAIL = "n8ter8@gmail.com";

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const ADMIN_EMAIL = process.env.ADMIN_SUPER_EMAIL || SEED_DEFAULT_ADMIN_EMAIL;

export function assertSeedConfig() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
    process.exit(1);
  }
}
