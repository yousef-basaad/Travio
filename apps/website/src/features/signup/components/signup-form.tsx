"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@travio/ui";
import { signupAction } from "@/app/signup/actions";
import type { SignupFieldName, SignupState } from "../schemas/signup.schema";

const initialState: SignupState = { status: "idle" };

const FIELDS: {
  name: SignupFieldName;
  label: string;
  type?: string;
  autoComplete: string;
}[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "agencyName", label: "Agency name", autoComplete: "organization" },
  { name: "crNumber", label: "CR number", autoComplete: "off" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  if (state.status === "check_email") {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Check your email to confirm your account, then sign in on the dashboard.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">We sent a confirmation link to {state.email}.</p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {FIELDS.map((field) => {
        const id = `signup-${field.name}`;
        const error = fieldErrors[field.name];
        return (
          <FormField key={field.name} label={field.label} htmlFor={id} error={error}>
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
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating your agency…" : "Create agency"}
      </Button>
    </form>
  );
}
