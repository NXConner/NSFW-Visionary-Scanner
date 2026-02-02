import { createClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL, assertSeedConfig } from "./config";

assertSeedConfig();

export const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
