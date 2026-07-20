"use server";

import { createServerSupabaseClient } from "@travio/database/server";

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
