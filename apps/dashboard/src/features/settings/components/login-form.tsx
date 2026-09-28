"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, type SignInState } from "@travio/auth";
import { Button } from "@travio/ui";
import { shouldRedirectAfterSignIn } from "../utils/sign-in-redirect";

const initialState: SignInState = { error: null };

// Same redirect-on-success pattern as the customer portal's LoginForm:
// signInWithPassword() sets the session cookie but never redirects, so
// without this a correct password left the user sitting on /login.
// router.refresh() makes the (dashboard) layout re-run requireRole()
// with the new session.
export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (shouldRedirectAfterSignIn({ hasSubmitted: hasSubmitted.current, pending, state })) {
      router.push("/");
      router.refresh();
    }
  }, [state, pending, router]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        hasSubmitted.current = true;
      }}
      className="w-80 space-y-4 rounded-lg border p-6"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
