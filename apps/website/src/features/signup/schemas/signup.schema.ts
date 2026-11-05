import { z } from "zod";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Error messages are message keys (lib/i18n/messages); SignupForm
// translates them, so the server action stays language-neutral.
export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "signup.error.fullName"),
  agencyName: z.string().trim().min(1, "signup.error.agencyName"),
  crNumber: z.string().trim().min(1, "signup.error.crNumber"),
  email: z.string().trim().email("signup.error.email"),
  password: z.string().min(8, "signup.error.password"),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type SignupFieldName = keyof SignupValues;

// What the form re-renders with after a failed submit - never the password.
export type SignupEchoValues = Partial<Record<Exclude<SignupFieldName, "password">, string>>;

export type SignupState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Partial<Record<SignupFieldName, string>>;
      formError: string | null;
      values: SignupEchoValues;
    }
  | { status: "check_email"; email: string };

export const SIGNUP_MESSAGES = {
  rateLimited: "signup.error.rateLimited",
  unknown: "signup.error.unknown",
  unavailable: "signup.error.unavailable",
} as const satisfies Record<string, MessageKey>;

export function readSignupForm(formData: FormData): Record<SignupFieldName, string> {
  const read = (name: SignupFieldName) => String(formData.get(name) ?? "");
  return {
    fullName: read("fullName"),
    agencyName: read("agencyName"),
    crNumber: read("crNumber"),
    email: read("email"),
    password: read("password"),
  };
}
