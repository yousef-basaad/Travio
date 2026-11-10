"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { signOut } from "@travio/auth";
import { Button } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { startMfaSetup, submitMfaCode, type MfaSetup } from "../api/mfa-actions";

// One screen for both cases: first-time setup shows the QR code; after
// that, only the code is asked for.
export function MfaForm({ mode }: { mode: "setup" | "verify" }) {
  const t = useT();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode === "setup") void startMfaSetup().then(setSetup);
  }, [mode]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitMfaCode(code, setup?.ok ? setup.factorId : undefined);
      if (result.ok) {
        // A full load, so every server component sees the upgraded session.
        window.location.href = "/";
        return;
      }
      setError(result.invalidCode ? "mfa.invalidCode" : "mfa.error");
    });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const setupFailed = mode === "setup" && setup?.ok === false;

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-7 shadow-sm">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-bold text-foreground">{t(mode === "setup" ? "mfa.setupTitle" : "mfa.verifyTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(mode === "setup" ? "mfa.setupHint" : "mfa.verifyHint")}</p>
      </div>

      {mode === "setup" && setup?.ok ? (
        <div className="space-y-2 text-center">
          <img src={setup.qrCode} alt={t("mfa.qrAlt")} className="mx-auto h-44 w-44 rounded-lg border bg-white p-2" />
          <p className="text-xs text-muted-foreground">{t("mfa.manualEntry")}</p>
          <code dir="ltr" data-mfa-secret className="block break-all rounded-md bg-muted px-2 py-1.5 text-xs">
            {setup.secret}
          </code>
        </div>
      ) : null}

      {setupFailed ? (
        <p role="alert" className="text-sm text-danger">
          {t("mfa.setupError")}
        </p>
      ) : (
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="mfa-code">
            {t("mfa.code")}
          </label>
          <input
            id="mfa-code"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={7}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-center text-lg tracking-widest"
          />
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {t(error)}
        </p>
      ) : null}

      {setupFailed ? null : (
        <Button type="submit" className="w-full" disabled={isPending || (mode === "setup" && !setup)}>
          {isPending ? t("mfa.checking") : t("mfa.submit")}
        </Button>
      )}
      <button type="button" onClick={handleSignOut} className="block w-full text-center text-xs text-muted-foreground hover:underline">
        {t("header.signOut")}
      </button>
    </form>
  );
}
