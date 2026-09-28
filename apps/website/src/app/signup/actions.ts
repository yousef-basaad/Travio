"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { signUpAgency, type SignUpAgencyResult } from "@travio/auth";
import {
  SIGNUP_MESSAGES,
  readSignupForm,
  signupSchema,
  type SignupEchoValues,
  type SignupFieldName,
  type SignupState,
} from "@/features/signup/schemas/signup.schema";
import { getDashboardUrl } from "@/features/signup/lib/dashboard-url";

// useActionState action for the agency signup form. Never throws to the
// user: validation, configuration, and Supabase failures all come back
// as SignupState. Only a successful signup that already has a session
// (email confirmation OFF) leaves the page, via redirect().
export async function signupAction(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const raw = readSignupForm(formData);
  const values: SignupEchoValues = {
    fullName: raw.fullName,
    agencyName: raw.agencyName,
    crNumber: raw.crNumber,
    email: raw.email,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<SignupFieldName, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as SignupFieldName;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", fieldErrors, formError: null, values };
  }

  const dashboardUrl = getDashboardUrl();
  if (!dashboardUrl) {
    console.error("Signup unavailable: NEXT_PUBLIC_DASHBOARD_URL is missing or not a valid http(s) URL");
    return { status: "error", fieldErrors: {}, formError: SIGNUP_MESSAGES.unavailable, values };
  }

  let result: SignUpAgencyResult;
  try {
    result = await signUpAgency({
      ...parsed.data,
      emailRedirectTo: `${dashboardUrl}/login?confirmed=1`,
    });
  } catch (error) {
    console.error("Signup failed unexpectedly", error);
    result = { status: "error", code: "unknown" };
  }

  switch (result.status) {
    case "agency_created":
    case "agency_setup_deferred":
      // "deferred" still has a working account; the dashboard finishes
      // the agency on first sign-in. The dashboard is a separate app, so
      // typedRoutes can't know this URL - hence the cast.
      redirect(`${dashboardUrl}/login?registered=1` as Route);
    case "confirmation_required":
      return { status: "check_email", email: parsed.data.email };
    case "error":
      // Never reveal whether an account exists: an already-registered
      // email gets exactly the same "check your email" state as (b).
      if (result.code === "email_taken") {
        return { status: "check_email", email: parsed.data.email };
      }
      return {
        status: "error",
        fieldErrors: {},
        formError: result.code === "rate_limited" ? SIGNUP_MESSAGES.rateLimited : SIGNUP_MESSAGES.unknown,
        values,
      };
  }
}
