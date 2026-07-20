import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";
import { SessionProvider } from "@travio/auth";

// Travio staff only. This is the platform's highest-privilege surface -
// the only app allowed to use @travio/database's admin (service-role)
// client for cross-tenant operations (e.g. deactivating a tenant).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole(["travio_admin"]);
  if (!result.authorized) redirect("/login");

  return (
    <SessionProvider profile={result.profile}>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </SessionProvider>
  );
}
