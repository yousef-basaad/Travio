"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@travio/ui";
import { signupAction } from "@/app/(marketing)/signup/actions";
import type { SignupFieldName, SignupState } from "../schemas/signup.schema";
import { useT } from "@/lib/i18n/i18n-provider";
import { isMessageKey } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";

const initialState: SignupState = { status: "idle" };

const FIELDS: {
  name: SignupFieldName;
  label: MessageKey;
  type?: string;
  autoComplete: string;
}[] = [
  { name: "fullName", label: "signup.fullName", autoComplete: "name" },
  { name: "agencyName", label: "signup.agencyName", autoComplete: "organization" },
  { name: "crNumber", label: "signup.crNumber", autoComplete: "off" },
  { name: "email", label: "signup.email", type: "email", autoComplete: "email" },
  { name: "password", label: "signup.password", type: "password", autoComplete: "new-password" },
];

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const t = useT();
  // Errors arrive as message keys; anything else is shown as written.
  const message = (text: string) => (isMessageKey(text) ? t(text) : text);

  if (state.status === "check_email") {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {t("signup.checkEmail")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("signup.sentTo", { email: state.email })}</p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {FIELDS.map((field) => {
        const id = `signup-${field.name}`;
        const rawError = fieldErrors[field.name];
        const error = rawError ? message(rawError) : undefined;
        return (
          <FormField key={field.name} label={t(field.label)} htmlFor={id} error={error}>
            <Input
              id={id}
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              required
              defaultValue={field.name === "password" ? undefined : values[field.name]}
              invalid={Boolean(error)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
          </FormField>
        );
      })}

      {state.status === "error" && state.formError ? (
        <p role="alert" className="text-sm text-danger">
          {message(state.formError)}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {t(pending ? "signup.submitting" : "signup.submit")}
      </Button>
    </form>
  );
}
