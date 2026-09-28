import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";
import { PageContainer } from "@travio/ui";
import { PortalHeader } from "@/components/portal-header";
import { NoPortalAccess } from "@/components/no-portal-access";

// Customers only - a separate identity from agency staff. This guard
// intentionally allows only "customer", matching this app's sole audience.
//
// Stabilization Phase 1: previously sent every unauthorized result to
// /login, which conflated three genuinely different situations: (1) no
// session at all, (2) a session that exists but isn't a "customer"
// account (requireRole()'s "forbidden"/"error" reasons - wrong role, or
// the profile lookup itself failed), and (3) a real "customer" session
// with no linked customer_id yet. (3) already had its own honest state
// (NoPortalAccess, below) and is untouched by this fix. (1) and (2) are
// now distinguished: no session -> /login; a session that exists but
// isn't authorized -> /forbidden (new - see apps/customer-portal/src/
// app/forbidden/page.tsx).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole(["customer"]);
  if (!result.authorized) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }
    // reason is "forbidden" or "error" - both land on /forbidden today,
    // same minimal-scope choice the dashboard/admin layouts document.
    redirect("/forbidden");
  }

  return (
    <SessionProvider profile={result.profile}>
      <div className="flex min-h-screen flex-col">
        <PortalHeader />
        <PageContainer>
          {/* A real "customer" session exists, but this identity's
              profile has no customerId - either they signed up publicly
              (handle_new_user's default branch) or their invite is still
              pending. Distinct from the unauthenticated redirect above -
              this is "authenticated, nothing to show yet", not "not
              logged in". */}
          {result.profile.customerId ? children : <NoPortalAccess />}
        </PageContainer>
      </div>
    </SessionProvider>
  );
}
