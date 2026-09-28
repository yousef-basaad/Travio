import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";

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

  return (
    <SessionProvider profile={result.profile}>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </SessionProvider>
  );
}
