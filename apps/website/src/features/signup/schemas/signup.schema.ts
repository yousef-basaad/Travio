import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name."),
  agencyName: z.string().trim().min(1, "Enter your agency's name."),
  crNumber: z.string().trim().min(1, "Enter your commercial registration (CR) number."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
  emailTaken: "An account with this email already exists. Sign in on the dashboard instead.",
  rateLimited: "Too many signup attempts. Please wait a few minutes and try again.",
  unknown: "We couldn't create your account. Please try again.",
  unavailable: "Signup is temporarily unavailable. Please try again later.",
} as const;

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
