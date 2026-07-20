import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";

// Customers only - a separate identity from agency staff. This guard
// intentionally allows only "customer", matching this app's sole audience.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole(["customer"]);
  if (!result.authorized) redirect("/login");

  return (
    <SessionProvider profile={result.profile}>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </SessionProvider>
  );
}
