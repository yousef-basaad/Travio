import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { MfaForm } from "@/features/auth/components/mfa-form";
import { getMfaState } from "@/lib/auth/mfa";

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const result = await requireRole(["travio_admin"]);
  if (!result.authorized) {
    redirect(result.reason === "unauthenticated" ? "/login" : "/forbidden");
  }

  const state = await getMfaState();
  if (state === "verified") redirect("/" as Route);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <MfaForm mode={state === "needs_code" ? "verify" : "setup"} />
    </div>
  );
}
