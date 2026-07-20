"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@travio/auth";
import { Button } from "@travio/ui";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);

  return (
    <form action={formAction} className="w-80 space-y-4 rounded-lg border p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
