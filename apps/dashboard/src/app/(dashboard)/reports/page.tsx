import { redirect } from "next/navigation";

// Reports live on /analytics (revenue, bookings, customers). This route
// stays only so old links and bookmarks still land somewhere real.
export default function ReportsPage() {
  redirect("/analytics");
}
