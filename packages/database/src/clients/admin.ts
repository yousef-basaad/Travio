import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/generated";

// Thrown when the service-role client can't be built because the
// server's environment is missing its key - a deployment/config fault,
// distinct from a query error, so callers can report it as such.
export class AdminClientConfigError extends Error {
  constructor() {
    super("SUPABASE_SERVICE_ROLE_KEY is not configured");
    this.name = "AdminClientConfigError";
  }
}

// Service-role client. BYPASSES RLS entirely.
// Server-only (webhooks, cron jobs, admin-panel privileged operations).
// Never import this in any Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser bundle.
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new AdminClientConfigError();
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } },
  );
}
