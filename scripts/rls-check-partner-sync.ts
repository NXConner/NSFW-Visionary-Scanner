import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.RLS_TEST_EMAIL;
const TEST_PASSWORD = process.env.RLS_TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "Missing SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY, RLS_TEST_EMAIL, or RLS_TEST_PASSWORD",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (authError) throw authError;

  const connectionId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("partner_thought_pings").insert({
    connection_id: connectionId,
    sender_id: crypto.randomUUID(),
    recipient_id: crypto.randomUUID(),
    message: "RLS test",
    status: "sent",
  });

  if (!insertError) {
    throw new Error("RLS check failed: insert succeeded unexpectedly");
  }

  console.log("RLS check passed: insert blocked as expected");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
