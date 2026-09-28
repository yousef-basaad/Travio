"use server";

import { createServerSupabaseClient } from "@travio/database/server";

export type SignUpAgencyInput = {
  email: string;
  password: string;
  fullName: string;
  agencyName: string;
  crNumber: string;
  /** Where the confirmation email link lands (the dashboard's /login). */
  emailRedirectTo: string;
};

export type SignUpAgencyErrorCode = "email_taken" | "rate_limited" | "unknown";

// Never throws - every outcome is a value the signup form can render.
//   - "agency_created":        signUp returned a session (email
//                              confirmation OFF) and create_agency() ran.
//   - "agency_setup_deferred": signUp returned a session but
//                              create_agency() failed; the dashboard's
//                              first-login completion finishes it from
//                              the user_metadata stored below.
//   - "confirmation_required": no session (email confirmation ON, the
//                              main path); the agency is created on the
//                              user's first dashboard sign-in.
export type SignUpAgencyResult =
  | { status: "agency_created" }
  | { status: "agency_setup_deferred" }
  | { status: "confirmation_required" }
  | { status: "error"; code: SignUpAgencyErrorCode };

const EMAIL_TAKEN_CODES = new Set(["user_already_exists", "email_exists"]);
const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

function toErrorCode(error: { code?: string; status?: number }): SignUpAgencyErrorCode {
  if (error.code && EMAIL_TAKEN_CODES.has(error.code)) return "email_taken";
  if (error.status === 429 || (error.code && RATE_LIMIT_CODES.has(error.code))) return "rate_limited";
  return "unknown";
}

export async function signUpAgency(input: SignUpAgencyInput): Promise<SignUpAgencyResult> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      // agency_name/cr_number let the dashboard create the agency on
      // first sign-in when no session exists yet (confirmation ON).
      data: {
        full_name: input.fullName,
        account_type: "agency",
        agency_name: input.agencyName,
        cr_number: input.crNumber,
      },
    },
  });

  if (error) {
    return { status: "error", code: toErrorCode(error) };
  }

  if (!data.user) {
    return { status: "error", code: "unknown" };
  }

  // With confirmation ON, Supabase answers a signUp for an already
  // registered email with a user that has no identities (and sends no
  // email) instead of an error.
  if (data.user.identities && data.user.identities.length === 0) {
    return { status: "error", code: "email_taken" };
  }

  if (!data.session) {
    return { status: "confirmation_required" };
  }

  const { error: agencyError } = await supabase.rpc("create_agency", {
    agency_name: input.agencyName,
    agency_cr_number: input.crNumber,
  });

  if (agencyError) {
    return { status: "agency_setup_deferred" };
  }

  return { status: "agency_created" };
}
