"use client";

import { PieChart } from "lucide-react";
import { Widget, DonutChart, DataTableState } from "@travio/ui";
import { useBookingAnalytics } from "@/features/analytics";
import { useT } from "@/lib/i18n/i18n-provider";

// Design System v2.5 (Product-8.2 Phase 3): the reference's "Quick
// Stats" donut - real service-type breakdown (bookingAnalytics.
// serviceDistribution: flights/hotels/transfers/visa), the exact same
// aggregate BookingStatusCard already shows as a bar list on the
// Analytics page. Same data, donut presentation here to match this
// screen's own reference layout.
export function QuickStatsDonut() {
  const t = useT();
  const { data: analytics, isLoading, isError } = useBookingAnalytics();
  const distribution = analytics?.serviceDistribution;
  const total = distribution
    ? distribution.flights + distribution.hotels + distribution.transfers + distribution.visa
    : 0;

  return (
    <Widget title={t("home.quickStats.title")} description={t("home.quickStats.description")}>
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("home.quickStats.error")}
        isEmpty={total === 0}
        emptyMessage={t("home.quickStats.empty")}
        emptyIcon={<PieChart size={20} />}
      >
        <DonutChart
          centerValue={String(total)}
          centerLabel={t("common.total")}
          segments={[
            { label: t("services.flight.title"), value: distribution?.flights ?? 0, color: "hsl(var(--primary))" },
            { label: t("services.hotel.title"), value: distribution?.hotels ?? 0, color: "hsl(var(--success))" },
            { label: t("services.transfer.title"), value: distribution?.transfers ?? 0, color: "hsl(var(--warning))" },
            { label: t("home.quickStats.visa"), value: distribution?.visa ?? 0, color: "hsl(var(--info))" },
          ]}
        />
      </DataTableState>
    </Widget>
  );
}
