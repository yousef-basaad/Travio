"use client";

import type { ReactNode } from "react";
import { BarChart3, Globe2, MapPin, PieChart, TrendingUp, Users } from "lucide-react";
import { Card, DataTableState, DonutChart, TrendChart } from "@travio/ui";
import type { ReportsOverview } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { countryName } from "@/lib/countries/countries";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useReportsOverview, useRevenueOverview } from "../api/analytics.api";
import { percent, reportRatios, staffCompletion } from "../utils/report-metrics";

const SERVICE_COLORS: Record<string, string> = {
  flight: "hsl(var(--primary))",
  hotel: "hsl(var(--success))",
  visa: "hsl(var(--info))",
  transfer: "hsl(var(--warning))",
  manual: "hsl(var(--muted-foreground))",
};

const SERVICE_KEYS: Record<string, MessageKey> = {
  flight: "reports.service.flight",
  hotel: "reports.service.hotel",
  visa: "reports.service.visa",
  transfer: "reports.service.transfer",
  manual: "reports.service.manual",
};

export function ReportCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function useMonthLabel() {
  const { locale } = useI18n();
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", timeZone: "UTC" });
  return (month: string) => formatter.format(new Date(`${month}-01T00:00:00Z`));
}

function Amount({ value, className }: { value: number; className?: string }) {
  const { t, format } = useI18n();
  return (
    <span className={className}>
      {format.number(value)} <span className="text-[10px] font-normal text-muted-foreground">{t("common.currencySar")}</span>
    </span>
  );
}

// Shared loading / error / empty frame for every card fed by
// reports_overview.
function OverviewState({
  isEmpty,
  emptyMessage,
  emptyIcon,
  children,
}: {
  isEmpty: (overview: ReportsOverview) => boolean;
  emptyMessage: string;
  emptyIcon: ReactNode;
  children: (overview: ReportsOverview) => ReactNode;
}) {
  const { t } = useI18n();
  const { data, isLoading, isError } = useReportsOverview();
  return (
    <DataTableState
      isLoading={isLoading}
      isError={isError}
      errorMessage={t("reports.error")}
      isEmpty={!data || isEmpty(data)}
      emptyMessage={emptyMessage}
      emptyIcon={emptyIcon}
    >
      {data ? children(data) : null}
    </DataTableState>
  );
}

// "المبيعات حسب الشهر" (07): invoiced per month, last 6 months.
export function SalesByMonth() {
  const { t, format } = useI18n();
  const monthLabel = useMonthLabel();
  const { data, isLoading, isError } = useRevenueOverview();
  const months = (data?.months ?? []).slice(-6);
  const max = Math.max(1, ...months.map((month) => month.invoiceTotal));

  return (
    <ReportCard title={t("reports.salesByMonth.title")} description={t("reports.salesByMonth.description")}>
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("reports.error")}
        isEmpty={months.every((month) => month.invoiceTotal === 0)}
        emptyMessage={t("reports.salesByMonth.empty")}
        emptyIcon={<BarChart3 size={20} />}
      >
        <div dir="ltr" className="flex h-48 items-end gap-3" role="img" aria-label={t("reports.salesByMonth.title")}>
          {months.map((month, index) => (
            <div key={month.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">{format.number(month.invoiceTotal)}</span>
              <div
                className={`w-full max-w-9 rounded-t ${index === months.length - 1 ? "bg-primary" : "bg-primary/60"}`}
                style={{ height: `${(month.invoiceTotal / max) * 100}%` }}
                title={`${monthLabel(month.month)}: ${format.number(month.invoiceTotal)}`}
              />
              <span className="text-[11px] text-muted-foreground">{monthLabel(month.month)}</span>
            </div>
          ))}
        </div>
      </DataTableState>
    </ReportCard>
  );
}

// "توزيع المبيعات حسب الخدمة" (07): invoice line items by service type.
export function SalesByService() {
  const { t, format } = useI18n();
  return (
    <ReportCard title={t("reports.byService.title")} description={t("reports.byService.description")}>
      <OverviewState
        isEmpty={(overview) => overview.salesByService.length === 0}
        emptyMessage={t("reports.byService.empty")}
        emptyIcon={<PieChart size={20} />}
      >
        {(overview) => (
          <DonutChart
            size={132}
            className="sm:flex-col"
            centerValue={format.number(overview.salesByService.reduce((sum, row) => sum + row.total, 0))}
            centerLabel={t("common.currencySar")}
            formatValue={format.number}
            segments={overview.salesByService.map((row) => ({
              label: SERVICE_KEYS[row.type] ? t(SERVICE_KEYS[row.type]!) : row.type,
              value: row.total,
              color: SERVICE_COLORS[row.type] ?? "hsl(var(--muted-foreground))",
            }))}
          />
        )}
      </OverviewState>
    </ReportCard>
  );
}

// "أفضل الوجهات مبيعاً" (07): destination countries by invoiced sales.
export function DestinationSales() {
  const { t, locale } = useI18n();
  const tag = intlLocale(locale);
  return (
    <ReportCard title={t("reports.destinations.title")} description={t("reports.destinations.description")}>
      <OverviewState
        isEmpty={(overview) => overview.salesByDestination.length === 0}
        emptyMessage={t("reports.destinations.empty")}
        emptyIcon={<MapPin size={20} />}
      >
        {(overview) => {
          const max = Math.max(1, ...overview.salesByDestination.map((row) => row.total));
          return (
            <ul className="space-y-3">
              {overview.salesByDestination.map((row) => (
                <li key={row.country} className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="truncate text-foreground">{countryName(row.country, tag)}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(row.total / max) * 100}%` }} aria-hidden="true" />
                  </div>
                  <Amount value={row.total} className="text-xs font-medium text-foreground" />
                </li>
              ))}
            </ul>
          );
        }}
      </OverviewState>
    </ReportCard>
  );
}

// "اتجاه الحجوزات" (07): confirmed vs cancelled bookings per month.
export function BookingsTrend() {
  const { t, format } = useI18n();
  const monthLabel = useMonthLabel();
  return (
    <ReportCard title={t("reports.bookingsTrend.title")} description={t("reports.bookingsTrend.description")}>
      <OverviewState
        isEmpty={(overview) => overview.bookingsByMonth.every((month) => month.total === 0)}
        emptyMessage={t("reports.bookingsTrend.empty")}
        emptyIcon={<TrendingUp size={20} />}
      >
        {(overview) => (
          <TrendChart
            height={180}
            labels={overview.bookingsByMonth.map((month) => monthLabel(month.month))}
            valueFormatter={format.number}
            series={[
              { name: t("reports.bookingsTrend.confirmed"), color: "hsl(var(--success))", values: overview.bookingsByMonth.map((m) => m.confirmed) },
              { name: t("reports.bookingsTrend.cancelled"), color: "hsl(var(--danger))", values: overview.bookingsByMonth.map((m) => m.cancelled) },
            ]}
          />
        )}
      </OverviewState>
    </ReportCard>
  );
}

// "توزيع العملاء حسب الجنسية" (07): customers per nationality as a share
// of all customers; customers without one fall under "Other".
export function CustomersByNationality() {
  const { t, format } = useI18n();
  return (
    <ReportCard title={t("reports.nationality.title")} description={t("reports.nationality.description")}>
      <OverviewState
        isEmpty={(overview) => overview.customersByNationality.total === 0}
        emptyMessage={t("reports.nationality.empty")}
        emptyIcon={<Globe2 size={20} />}
      >
        {(overview) => {
          const { total, items } = overview.customersByNationality;
          const rest = total - items.reduce((sum, item) => sum + item.count, 0);
          const rows = [...items, ...(rest > 0 ? [{ label: t("reports.nationality.other"), count: rest }] : [])];
          return (
            <ul className="space-y-3">
              {rows.map((row) => {
                const share = percent(row.count, total) ?? 0;
                return (
                  <li key={row.label} className="grid grid-cols-[6rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                    <span className="truncate text-foreground">{row.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-info" style={{ width: `${share}%` }} aria-hidden="true" />
                    </div>
                    <span className="text-end text-xs text-muted-foreground" title={format.number(row.count)}>
                      {share}%
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }}
      </OverviewState>
    </ReportCard>
  );
}

// "أداء الموظفين" (07): bookings, invoiced sales and completion per
// assigned staff member.
export function StaffPerformance() {
  const { t, format } = useI18n();
  return (
    <ReportCard title={t("reports.staff.title")} description={t("reports.staff.description")}>
      <OverviewState
        isEmpty={(overview) => overview.staff.length === 0}
        emptyMessage={t("reports.staff.empty")}
        emptyIcon={<Users size={20} />}
      >
        {(overview) => (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 text-start font-medium">{t("reports.staff.member")}</th>
                <th className="pb-2 text-center font-medium">{t("reports.staff.bookings")}</th>
                <th className="pb-2 text-end font-medium">{t("reports.staff.sales")}</th>
                <th className="pb-2 text-end font-medium">{t("reports.staff.completion")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {overview.staff.map((member) => {
                const completion = staffCompletion(member);
                return (
                  <tr key={member.profileId}>
                    <td className="max-w-[8rem] truncate py-2.5 font-medium text-foreground">{member.name}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{format.number(member.bookings)}</td>
                    <td className="py-2.5 text-end">
                      <Amount value={member.sales} className="text-xs text-foreground" />
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-medium text-success">{completion === null ? "—" : `${completion}%`}</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-success" style={{ width: `${completion ?? 0}%` }} aria-hidden="true" />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </OverviewState>
    </ReportCard>
  );
}

// "نمو المبيعات السنوي" (07): invoiced per month this year against the
// same months last year, up to the current month.
export function AnnualGrowth() {
  const { t, locale, format } = useI18n();
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", timeZone: "UTC" });
  return (
    <ReportCard title={t("reports.annual.title")} description={t("reports.annual.description")}>
      <OverviewState
        isEmpty={(overview) => overview.annualSales.months.every((m) => m.current === 0 && m.previous === 0)}
        emptyMessage={t("reports.annual.empty")}
        emptyIcon={<TrendingUp size={20} />}
      >
        {(overview) => {
          const { year } = overview.annualSales;
          const months = overview.annualSales.months.slice(0, new Date().getUTCMonth() + 1);
          return (
            <TrendChart
              height={180}
              labels={months.map((m) => formatter.format(new Date(Date.UTC(year, m.month - 1, 1))))}
              valueFormatter={format.number}
              series={[
                { name: String(year), color: "hsl(var(--primary))", values: months.map((m) => m.current) },
                { name: String(year - 1), color: "hsl(var(--muted-foreground))", values: months.map((m) => m.previous) },
              ]}
            />
          );
        }}
      </OverviewState>
    </ReportCard>
  );
}

// "نظرة عامة على الأداء" (07): ratios from real counts; "—" where there
// is nothing to measure yet.
export function PerformanceOverview() {
  const { t, format } = useI18n();
  return (
    <ReportCard title={t("reports.performance.title")} description={t("reports.performance.description")}>
      <OverviewState isEmpty={() => false} emptyMessage="" emptyIcon={null}>
        {(overview) => {
          const ratios = reportRatios(overview);
          const pct = (value: number | null) => (value === null ? "—" : `${value}%`);
          const tiles: { label: string; value: ReactNode }[] = [
            { label: t("reports.performance.repeatRate"), value: pct(ratios.repeatRate) },
            {
              label: t("reports.performance.avgTrip"),
              value:
                overview.avgTripDays === null ? "—" : t("reports.performance.days", { count: format.number(overview.avgTripDays) }),
            },
            { label: t("reports.performance.cancelRate"), value: pct(ratios.cancelRate) },
            { label: t("reports.performance.tickets"), value: format.number(overview.flightTickets) },
            {
              label: t("reports.performance.revenuePerCustomer"),
              value: ratios.revenuePerCustomer === null ? "—" : <Amount value={ratios.revenuePerCustomer} />,
            },
            { label: t("reports.performance.completed"), value: format.number(overview.completedBookings) },
          ];
          return (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tiles.map((tile) => (
                <div key={tile.label} className="rounded-lg border border-border/70 p-3 text-center">
                  <dt className="text-[11px] text-muted-foreground">{tile.label}</dt>
                  <dd className="mt-1 text-lg font-bold text-foreground">{tile.value}</dd>
                </div>
              ))}
            </dl>
          );
        }}
      </OverviewState>
    </ReportCard>
  );
}
