"use server";

import { createServerSupabaseClient } from "@travio/database/server";
import { clearFailures, clientAddress, isBlocked, recordFailure, throttleKeys } from "./login-throttle";

export type SignInState = { error: string | null; code?: "too_many_attempts" };

const TOO_MANY_ATTEMPTS = "Too many sign-in attempts. Please wait 15 minutes and try again.";

// Shared Server Action for email/password sign-in, used by dashboard,
// customer-portal, and admin (each with its own form + redirect target).
// Failed attempts are throttled here (see 20261110160000), because the
// auth service sees every request coming from this server.
export async function signInWithPassword(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const keys = throttleKeys(email, await clientAddress());
  if (await isBlocked(keys)) {
    return { error: TOO_MANY_ATTEMPTS, code: "too_many_attempts" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Only a wrong password counts. An outage shouldn't lock anyone out.
    if (error.code === "invalid_credentials") await recordFailure(keys);
    return { error: error.message };
  }

  await clearFailures(keys);
  return { error: null };
}
