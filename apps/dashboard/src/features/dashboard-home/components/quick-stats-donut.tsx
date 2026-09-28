"use client";

import { PieChart } from "lucide-react";
import { Widget, DonutChart, DataTableState } from "@travio/ui";
import { useBookingAnalytics } from "@/features/analytics";

// Design System v2.5 (Product-8.2 Phase 3): the reference's "Quick
// Stats" donut - real service-type breakdown (bookingAnalytics.
// serviceDistribution: flights/hotels/transfers/visa), the exact same
// aggregate BookingStatusCard already shows as a bar list on the
// Analytics page. Same data, donut presentation here to match this
// screen's own reference layout.
export function QuickStatsDonut() {
  const { data: analytics, isLoading, isError } = useBookingAnalytics();
  const distribution = analytics?.serviceDistribution;
  const total = distribution
    ? distribution.flights + distribution.hotels + distribution.transfers + distribution.visa
    : 0;

  return (
    <Widget title="Quick Stats" description="Booking mix by service type">
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={total === 0}
        emptyMessage="No services attached to any booking yet"
        emptyIcon={<PieChart size={20} />}
      >
        <DonutChart
          centerValue={String(total)}
          centerLabel="Total"
          segments={[
            { label: "Flights", value: distribution?.flights ?? 0, color: "hsl(var(--primary))" },
            { label: "Hotels", value: distribution?.hotels ?? 0, color: "hsl(var(--success))" },
            { label: "Transfers", value: distribution?.transfers ?? 0, color: "hsl(var(--warning))" },
            { label: "Visa", value: distribution?.visa ?? 0, color: "hsl(var(--info))" },
          ]}
        />
      </DataTableState>
    </Widget>
  );
}
