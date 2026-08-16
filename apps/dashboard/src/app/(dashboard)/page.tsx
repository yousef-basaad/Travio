import { DashboardHomePage } from "@/features/dashboard-home";

// The dashboard's real landing page ("/") - previously this route just
// redirected to /analytics (no dedicated overview existed). Living
// inside the (dashboard) route group means it's covered by the same
// requireRole() gate as every other dashboard page, one redirect fewer
// for an authenticated visitor than the old app/page.tsx -> /analytics
// hop.
export default function Page() {
  return <DashboardHomePage />;
}
