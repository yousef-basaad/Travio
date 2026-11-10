import type { Route } from "next";
import { redirect } from "next/navigation";
import { getMfaState } from "@/lib/auth/mfa";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";
import { AdminShell } from "@/components/admin-shell";

// Travio staff only. This is the platform's highest-privilege surface -
// the only app allowed to use @travio/database's admin (service-role)
// client for cross-tenant operations (e.g. deactivating a tenant).
//
// Stabilization Phase 1: previously sent every unauthorized result
// (including a valid session with the wrong role) to /login, masking a
// real "you don't have permission" outcome as if the session itself had
// been lost - the exact issue already fixed in the dashboard app's own
// layout. Matched here: no session -> /login; a session that exists but
// isn't authorized (wrong role, or requireRole()'s own "error" reason -
// see require-role.ts) -> /forbidden.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole(["travio_admin"]);
  if (!result.authorized) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }
    // reason is "forbidden" or "error" - both land on /forbidden today,
    // same minimal-scope choice the dashboard app's layout documents.
    redirect("/forbidden");
  }

  // The password alone isn't enough for this console.
  if ((await getMfaState()) !== "verified") {
    redirect("/mfa" as Route);
  }

  return (
    <SessionProvider profile={result.profile}>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
