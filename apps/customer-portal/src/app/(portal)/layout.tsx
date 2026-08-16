import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";
import { PageContainer } from "@travio/ui";
import { PortalHeader } from "@/components/portal-header";
import { NoPortalAccess } from "@/components/no-portal-access";

// Customers only - a separate identity from agency staff. This guard
// intentionally allows only "customer", matching this app's sole audience.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole(["customer"]);
  if (!result.authorized) redirect("/login");

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
