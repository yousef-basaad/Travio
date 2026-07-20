"use server";

import { createAdminSupabaseClient } from "@travio/database/admin";
import { inquirySchema } from "../schemas/inquiry.schema";

// Public form -> no authenticated user/session exists yet, so this uses
// the admin client (service role) purely to insert into a public
// "leads" table that has no user-facing RLS read policy at all.
export async function submitInquiry(formData: FormData) {
  const parsed = inquirySchema.parse({
    agencyName: formData.get("agencyName"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("leads").insert({
    agency_name: parsed.agencyName,
    email: parsed.email,
    message: parsed.message,
  });
  if (error) throw error;
}
