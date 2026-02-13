import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMAILS = ["n8ter8@gmail.com", "butterflii18@gmail.com"] as const;

function normalizeEmail(input: unknown): string {
  return String(input || "")
    .trim()
    .toLowerCase();
}

function getEmailsFromArgsOrEnv(): string[] {
  const argEmails = process.argv
    .slice(2)
    .filter(Boolean)
    .flatMap(a => a.split(","))
    .map(normalizeEmail)
    .filter(Boolean);

  if (argEmails.length) return Array.from(new Set(argEmails));

  const envEmails = String(process.env.CORE_CONFIRM_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
  if (envEmails.length) return Array.from(new Set(envEmails));

  return [...DEFAULT_EMAILS];
}

function assertConfig(): { url: string; serviceRoleKey: string } {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url) {
    throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL).");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

async function confirmEmail(params: {
  supabase: ReturnType<typeof createClient>;
  email: string;
}): Promise<{ email: string; userId: string; wasAlreadyConfirmed: boolean }> {
  const email = normalizeEmail(params.email);
  if (!email) throw new Error("Invalid email");

  const { data: lookup, error: lookupError } =
    await params.supabase.auth.admin.getUserByEmail(email);
  if (lookupError)
    throw new Error(`auth.admin.getUserByEmail failed for ${email}: ${lookupError.message}`);
  if (!lookup?.user?.id) throw new Error(`Auth user not found for ${email}`);

  const userId = lookup.user.id;
  const wasAlreadyConfirmed = Boolean(lookup.user.email_confirmed_at);

  const { data: updated, error: updateError } = await params.supabase.auth.admin.updateUserById(
    userId,
    { email_confirm: true },
  );
  if (updateError)
    throw new Error(`auth.admin.updateUserById failed for ${email}: ${updateError.message}`);
  if (!updated?.user?.id)
    throw new Error(`auth.admin.updateUserById returned no user for ${email}`);

  return { email, userId, wasAlreadyConfirmed };
}

async function run(): Promise<void> {
  const { url, serviceRoleKey } = assertConfig();
  const emails = getEmailsFromArgsOrEnv();

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  console.log("Confirming core emails in Supabase Auth...");
  console.log(`- Project: ${url}`);
  console.log(`- Emails: ${emails.join(", ")}`);

  const results: Array<{ email: string; ok: boolean; message: string }> = [];

  for (const email of emails) {
    try {
      const res = await confirmEmail({ supabase, email });
      results.push({
        email: res.email,
        ok: true,
        message: res.wasAlreadyConfirmed
          ? `already confirmed (user: ${res.userId})`
          : `confirmed now (user: ${res.userId})`,
      });
    } catch (err) {
      results.push({
        email: normalizeEmail(email),
        ok: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const failed = results.filter(r => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.email}: ${r.message}`);
  }

  if (failed.length) {
    process.exitCode = 1;
  }
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error("❌ Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
