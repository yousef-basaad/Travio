"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { signInWithPassword, type SignInState } from "@travio/auth";
import { Button } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

const initialState: SignInState = { error: null };

// Same flow as the dashboard's LoginForm: signInWithPassword() sets the
// session cookie but never redirects, so a finished, error-free submit
// pushes to "/" and refreshes, letting (admin)/layout.tsx's requireRole()
// decide between the console and /forbidden.
export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current && !pending && state.error === null) {
      // "/" is the overview page; typed routes only learn it after a build.
      router.push("/" as Route);
      router.refresh();
    }
  }, [state, pending, router]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        hasSubmitted.current = true;
      }}
      className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-7 shadow-sm"
    >
      <div className="space-y-1 text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
        >
          T
        </span>
        <h1 className="font-heading text-xl font-bold text-foreground">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="email">
          {t("login.email")}
        </label>
        <input id="email" name="email" type="email" dir="ltr" required autoComplete="email" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="password">
          {t("login.password")}
        </label>
        <input id="password" name="password" type="password" dir="ltr" required autoComplete="current-password" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.code === "too_many_attempts" ? t("login.tooManyAttempts") : state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
