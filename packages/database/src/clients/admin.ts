import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/generated";

// Service-role client. BYPASSES RLS entirely.
// Server-only (webhooks, cron jobs, admin-panel privileged operations).
// Never import this in any Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser bundle.
export function createAdminSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
