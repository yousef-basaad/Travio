"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, type SignInState } from "@travio/auth";
import { Button, Card, CardContent, CardHeader, FormField, Input } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const initialState: SignInState = { error: null };

// The sign-in action returns the auth service's English message; the
// customer sees it in their own language instead.
function signInErrorKey(state: SignInState): MessageKey {
  if (state.code === "too_many_attempts") return "login.tooManyAttempts";
  if (state.error === "Invalid login credentials") return "login.invalidCredentials";
  return "login.failed";
}

// Reuses the same signInWithPassword Server Action the dashboard's own
// LoginForm uses (packages/auth) - only the surrounding form/redirect
// target differs per app, same as that file's own comment documents.
// Unlike the dashboard's version, this redirects on success: a
// customer's login is the entry point to the whole portal, so silently
// doing nothing after a correct password would be a dead end, not a
// stylistic choice to omit.
export function LoginForm() {
  const router = useRouter();
  const t = useT();
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current && !pending && state.error === null) {
      router.push("/bookings");
      router.refresh();
    }
  }, [state, pending, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-heading-md text-foreground">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          onSubmit={() => {
            hasSubmitted.current = true;
          }}
          className="space-y-4"
          noValidate
        >
          <FormField label={t("login.email")} htmlFor="login-email">
            <Input id="login-email" name="email" type="email" dir="ltr" required autoComplete="email" />
          </FormField>

          <FormField label={t("login.password")} htmlFor="login-password">
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FormField>

          {state.error && (
            <p role="alert" className="text-sm text-danger">
              {t(signInErrorKey(state))}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
