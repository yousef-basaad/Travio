import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";

export type MfaState = "verified" | "needs_code" | "needs_setup";

// Where this session stands: already passed a second factor, has a factor
// but hasn't entered a code yet, or has never set one up.
export async function getMfaState(): Promise<MfaState> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "needs_setup";
  if (data.currentLevel === "aal2") return "verified";
  return data.nextLevel === "aal2" ? "needs_code" : "needs_setup";
}

// For pages and actions that run alongside the layout's gate.
export async function isVerifiedAdmin(): Promise<boolean> {
  if (!(await requireRole(["travio_admin"])).authorized) return false;
  return (await getMfaState()) === "verified";
}
