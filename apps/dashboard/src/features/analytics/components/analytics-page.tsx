"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@travio/ui";
import { ReportKpis } from "./report-kpis";
import {
  AnnualGrowth,
  BookingsTrend,
  CustomersByNationality,
  DestinationSales,
  PerformanceOverview,
  SalesByMonth,
  SalesByService,
  StaffPerformance,
} from "./report-cards";
import { useT } from "@/lib/i18n/i18n-provider";

// Reports & Analytics from the TRAVIO design (07). Every number comes
// from Postgres under the caller's RLS (reports_overview and the existing
// analytics functions). `profitKpi` is the finance-only profit card,
// passed in by the route so this feature doesn't import the finance one.
export function AnalyticsPage({ profitKpi }: { profitKpi?: ReactNode }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.title")} description={t("reports.description")} />

      <ReportKpis extra={profitKpi} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <SalesByMonth />
        <SalesByService />
        <DestinationSales />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <BookingsTrend />
        <CustomersByNationality />
        <StaffPerformance />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AnnualGrowth />
        </div>
        <PerformanceOverview />
      </div>
    </div>
  );
}
