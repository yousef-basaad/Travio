"use server";

import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { normalizeMfaCode } from "../utils/mfa-code";

export type MfaSetup = { ok: true; factorId: string; qrCode: string; secret: string } | { ok: false };

// Starts a new authenticator setup. A setup that was never finished is
// discarded first, or the next enrollment would be refused.
export async function startMfaSetup(): Promise<MfaSetup> {
  if (!(await requireRole(["travio_admin"])).authorized) return { ok: false };

  const supabase = await createServerSupabaseClient();
  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { ok: false };

  // A verified factor means setup is done; this must not add another.
  if (factors.data.totp.length > 0) return { ok: false };

  for (const factor of factors.data.all) {
    if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Travio admin ${Date.now()}` });
  if (error) {
    console.error("[admin] MFA enrollment failed", error.message);
    return { ok: false };
  }
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

// Checks a code against the factor being set up, or against the account's
// verified factor. The session is upgraded to aal2 on success.
export async function submitMfaCode(rawCode: string, setupFactorId?: string): Promise<{ ok: boolean; invalidCode?: boolean }> {
  if (!(await requireRole(["travio_admin"])).authorized) return { ok: false };

  const code = normalizeMfaCode(rawCode);
  if (!code) return { ok: false, invalidCode: true };

  const supabase = await createServerSupabaseClient();
  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { ok: false };

  // The id comes from the browser, so it has to be one of this account's
  // own factors.
  const factorId = setupFactorId
    ? factors.data.all.find((factor) => factor.id === setupFactorId)?.id
    : factors.data.totp[0]?.id;
  if (!factorId) return { ok: false };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { ok: false, invalidCode: true };
  return { ok: true };
}
