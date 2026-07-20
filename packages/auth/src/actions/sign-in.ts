"use server";

import { createServerSupabaseClient } from "@travio/database/server";

export type SignInState = { error: string | null };

// Shared Server Action for email/password sign-in, used by dashboard,
// customer-portal, and admin (each with its own form + redirect target).
export async function signInWithPassword(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
