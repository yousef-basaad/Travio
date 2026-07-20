import { redirect } from "next/navigation";
import { requireRole } from "@travio/auth/server";

// Route-group guard: every page under (dashboard) requires agency staff.
// Individual feature pages don't re-check auth - this is the single
// enforcement point, matching the RLS enforcement point in the database.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await requireRole([
  "agency_owner",
  "sales_agent"
]);

  if (!result.authorized) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">{/* Sidebar nav - see components/ */}</aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
