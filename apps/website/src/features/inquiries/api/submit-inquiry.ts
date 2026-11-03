"use server";

import { createAdminSupabaseClient } from "@travio/database/admin";
import { HONEYPOT_FIELD, inquirySchema, type InquiryResult } from "../schemas/inquiry.schema";

const PER_EMAIL_LIMIT = 3;
const PER_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const SITE_LIMIT = 30;
const SITE_WINDOW_MS = 10 * 60 * 1000;

// Public form -> no authenticated user/session exists yet, so this uses
// the admin client (service role) purely to insert into a public
// "leads" table that has no user-facing RLS read policy at all.
//
// Because it's an unauthenticated write with the service role, it's
// guarded three ways:
//   - a honeypot field: when filled (by a bot), report success and save
//     nothing, so the bot gets no signal
//   - at most PER_EMAIL_LIMIT inquiries per email per hour
//   - at most SITE_LIMIT inquiries site-wide per 10 minutes (a flood
//     from many addresses)
// Both limits are counted from the leads table itself, so they hold
// across server instances without extra infrastructure.
export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { status: "sent" };
  }

  const parsed = inquirySchema.parse({
    agencyName: formData.get("agencyName"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  const supabase = createAdminSupabaseClient();
  const now = Date.now();

  const [perEmail, siteWide] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("email", parsed.email)
      .gte("created_at", new Date(now - PER_EMAIL_WINDOW_MS).toISOString()),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now - SITE_WINDOW_MS).toISOString()),
  ]);
  if (perEmail.error) throw perEmail.error;
  if (siteWide.error) throw siteWide.error;

  if ((perEmail.count ?? 0) >= PER_EMAIL_LIMIT || (siteWide.count ?? 0) >= SITE_LIMIT) {
    return { status: "rate_limited" };
  }

  const { error } = await supabase.from("leads").insert({
    agency_name: parsed.agencyName,
    email: parsed.email,
    message: parsed.message,
  });
  if (error) throw error;

  return { status: "sent" };
}
