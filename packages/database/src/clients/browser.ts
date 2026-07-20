"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types/generated";

// Use inside Client Components only. Respects RLS via the anon key +
// the user's session cookie — never has elevated privileges.
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
