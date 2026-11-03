import { z } from "zod";

// Upper bounds keep a single public submission from storing arbitrarily
// large text (this form writes with the service-role client). Email is
// lowercased so the per-email limit can't be dodged by changing case.
export const inquirySchema = z.object({
  agencyName: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  message: z.string().trim().min(10).max(5000),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;

// Lives here, not in the "use server" action file, which may only export
// async functions.
export type InquiryResult = { status: "sent" } | { status: "rate_limited" };

// Name of the hidden field bots tend to fill in (see InquiryForm).
export const HONEYPOT_FIELD = "website";
