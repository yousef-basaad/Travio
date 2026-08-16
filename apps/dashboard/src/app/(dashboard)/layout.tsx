import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";
import { DashboardShell } from "@/components/dashboard-shell";

// Route-group guard: every page under (dashboard) requires agency staff.
// Individual feature pages don't re-check auth - this is the single
// entry-point gate. Per-domain authorization (which API routes a given
// role can actually call - Finance vs Visa vs CRM) happens at the route
// level via requireXAccess() in lib/auth/require-domain-access.ts; this
// gate only decides who gets into the dashboard app at all. visa_officer
// and accountant are included here (Phase 4D) since they now have their
// own domain-specific routes to reach (Visa, Finance) even though neither
// role could enter this app before.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole([
    "travio_admin",
    "agency_owner",
    "branch_manager",
    "sales_agent",
    "visa_officer",
    "accountant",
  ]);

  // Investigation finding: previously both "unauthenticated" and
  // "forbidden" were sent to /login, which masks a real authorization
  // problem (wrong/missing role) as if the session itself had been
  // lost. Now: no session -> /login (the real login flow); a valid
  // session with the wrong role -> /forbidden (a clear "no permission"
  // page), never the login screen.
  if (!result.authorized) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }
    redirect("/forbidden");
  }

  return (
    <SessionProvider profile={result.profile}>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
