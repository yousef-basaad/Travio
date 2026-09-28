import { PageHeader } from "@travio/ui";
import { AnalyticsMetrics } from "./analytics-metrics";
import { RevenueOverview } from "./revenue-overview";
import { BookingStatusCard } from "./booking-status-card";
import { CustomerInsights } from "./customer-insights";
import { RecentBookings } from "./recent-bookings";
import { TopDestinations } from "./top-destinations";

// Section eyebrow - a small uppercase label above each of the five named
// sections this page is structured around (KPI Grid / Revenue Trend /
// Booking Analytics / Customer Insights / Recent Activity), matching
// every other section-eyebrow already used elsewhere in the design
// system (e.g. sidebar group labels).
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

// Full page composition, extracted here (rather than living directly in
// app/(dashboard)/analytics/page.tsx) so the route file stays a thin
// shell - matching CustomersPage/LeadsPage's own convention of a
// one-line page.tsx rendering a feature component. Phase UI-2:
// restructured into five explicit sections (each card underneath is
// unchanged in data source - only the page-level grouping/labeling and
// each card's own visual polish changed).
export function AnalyticsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Analytics"
        description="Overview of bookings, revenue, and customers across your agency"
      />

      <section className="space-y-4">
        <SectionLabel>KPI Grid</SectionLabel>
        <AnalyticsMetrics />
      </section>

      <section className="space-y-4">
        <SectionLabel>Revenue Trend</SectionLabel>
        <RevenueOverview />
      </section>

      <section className="space-y-4">
        <SectionLabel>Booking Analytics &amp; Customer Insights</SectionLabel>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <BookingStatusCard />
          <CustomerInsights />
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel>Recent Activity</SectionLabel>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentBookings />
          <TopDestinations />
        </div>
      </section>
    </div>
  );
}
