"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, CalendarCheck2, Receipt, TrendingUp, Users, UsersRound, Wallet } from "lucide-react";
import { Card, DonutChart, KpiCard, LtrText, PageHeader } from "@travio/ui";
import type { PlatformActivityKind, PlatformOverview } from "@travio/api";
import { RelativeTime } from "@/components/relative-time";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { monthTrend } from "../utils/month-trend";

const ICON_SIZE = 20;

const PLAN_COLORS: Record<string, string> = {
  starter: "hsl(var(--info))",
  business: "hsl(var(--primary))",
  enterprise: "hsl(var(--success))",
  none: "hsl(var(--muted-foreground))",
};
const PLAN_KEYS: Record<string, MessageKey> = {
  starter: "overview.plan.starter",
  business: "overview.plan.business",
  enterprise: "overview.plan.enterprise",
  none: "overview.plan.none",
};
const STATUS_ORDER = ["draft", "pending", "confirmed", "completed", "cancelled"] as const;
const STATUS_TONE: Record<(typeof STATUS_ORDER)[number], string> = {
  draft: "bg-muted-foreground",
  pending: "bg-warning",
  confirmed: "bg-info",
  completed: "bg-success",
  cancelled: "bg-danger",
};
const ACTIVITY_TONE: Record<PlatformActivityKind, string> = {
  agency_created: "bg-primary/10 text-primary",
  booking_created: "bg-info/10 text-info",
  payment_received: "bg-success/10 text-success",
};
const ACTIVITY_ICON: Record<PlatformActivityKind, ReactNode> = {
  agency_created: <Building2 size={14} />,
  booking_created: <CalendarCheck2 size={14} />,
  payment_received: <Receipt size={14} />,
};

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`p-5 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

// Revenue per day as bars with bookings per day as a line on its own
// scale; each day carries both numbers as a tooltip.
function RevenueBookingsChart({ overview }: { overview: PlatformOverview }) {
  const { t, locale, format } = useI18n();
  const days = overview.daily;
  const dayLabel = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" });
  const label = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));
  const maxRevenue = Math.max(1, ...days.map((day) => day.revenue));
  const maxBookings = Math.max(1, ...days.map((day) => day.bookings));
  const empty = days.every((day) => day.revenue === 0 && day.bookings === 0);

  if (empty) return <Empty>{t("overview.chart.empty")}</Empty>;

  const points = days
    .map((day, index) => `${((index + 0.5) / days.length) * 100},${100 - (day.bookings / maxBookings) * 92}`)
    .join(" ");

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-success" aria-hidden="true" />
          {t("overview.chart.revenue")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-primary" aria-hidden="true" />
          {t("overview.chart.bookings")}
        </span>
      </div>
      <div dir="ltr" className="relative h-52" role="img" aria-label={t("overview.chart.title")}>
        <div className="flex h-full items-end gap-[3px]">
          {days.map((day) => (
            <div
              key={day.day}
              className="flex-1 rounded-t-sm bg-success/80 hover:bg-success"
              style={{ height: `${Math.max(day.revenue > 0 ? 2 : 0, (day.revenue / maxRevenue) * 92)}%` }}
              title={`${label(day.day)} - ${t("overview.chart.revenue")}: ${format.number(day.revenue)} · ${t("overview.chart.bookings")}: ${format.number(day.bookings)}`}
            />
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
      <div dir="ltr" className="mt-2 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
        <span>{label(days[0]!.day)}</span>
        <span>{label(days[Math.floor(days.length / 2)]!.day)}</span>
        <span>{label(days[days.length - 1]!.day)}</span>
      </div>
    </div>
  );
}

// The Super Admin overview from the TRAVIO design: platform-wide totals,
// daily revenue and bookings, agencies per plan, bookings by status, the
// newest agencies, the latest activity and a revenue summary. All of it
// from platform_overview() - real numbers only.
export function PlatformOverviewView({ overview }: { overview: PlatformOverview }) {
  const { t, format } = useI18n();
  const currency = t("common.currencySar");
  const vsLastMonth = t("common.vsLastMonth");
  const outstanding = Math.max(0, overview.revenue - overview.collected);
  const withTrend = (current: number, previous: number) => {
    const trend = monthTrend(current, previous);
    return { trend, trendContext: trend ? vsLastMonth : undefined };
  };
  // A total's change this month: now against where it stood when the month began.
  const totalTrend = (total: number, newThisMonth: number) => withTrend(total, total - newThisMonth);
  const planTotal = overview.byPlan.reduce((sum, row) => sum + row.agencies, 0);
  const statusTotal = Object.values(overview.bookingsByStatus).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("overview.title")} description={t("overview.description")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label={t("overview.kpi.agencies")}
          value={format.number(overview.agencies)}
          icon={<Building2 size={ICON_SIZE} />}
          tone="primary"
          {...totalTrend(overview.agencies, overview.thisMonth.agencies)}
          footer={<p className="text-xs text-muted-foreground">{t("overview.kpi.agenciesActive", { count: format.number(overview.activeAgencies) })}</p>}
        />
        <KpiCard
          label={t("overview.kpi.customers")}
          value={format.number(overview.customers)}
          icon={<Users size={ICON_SIZE} />}
          tone="success"
          {...totalTrend(overview.customers, overview.thisMonth.customers)}
        />
        <KpiCard
          label={t("overview.kpi.bookings")}
          value={format.number(overview.bookings)}
          icon={<CalendarCheck2 size={ICON_SIZE} />}
          tone="info"
          {...totalTrend(overview.bookings, overview.thisMonth.bookings)}
        />
        <KpiCard
          label={t("overview.kpi.revenue")}
          value={format.number(overview.revenue)}
          unit={currency}
          icon={<TrendingUp size={ICON_SIZE} />}
          tone="warning"
          {...totalTrend(overview.revenue, overview.thisMonth.revenue)}
        />
        <KpiCard
          label={t("overview.kpi.outstanding")}
          value={format.number(outstanding)}
          unit={currency}
          icon={<Wallet size={ICON_SIZE} />}
          tone="danger"
          trendContext={t("overview.kpi.outstandingContext")}
        />
        <KpiCard
          label={t("overview.kpi.users")}
          value={format.number(overview.users)}
          icon={<UsersRound size={ICON_SIZE} />}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title={t("overview.chart.title")} className="lg:col-span-2">
          <p className="-mt-3 mb-4 text-xs text-muted-foreground">{t("overview.chart.description")}</p>
          <RevenueBookingsChart overview={overview} />
        </Panel>

        <Panel title={t("overview.plans.title")}>
          {planTotal === 0 ? (
            <Empty>{t("overview.agencies.empty")}</Empty>
          ) : (
            <DonutChart
              size={132}
              className="sm:flex-col"
              centerValue={format.number(planTotal)}
              centerLabel={t("overview.plans.center")}
              formatValue={format.number}
              segments={overview.byPlan.map((row) => ({
                label: PLAN_KEYS[row.plan] ? t(PLAN_KEYS[row.plan]!) : row.plan,
                value: row.agencies,
                color: PLAN_COLORS[row.plan] ?? "hsl(var(--warning))",
              }))}
            />
          )}
        </Panel>

        <Panel title={t("overview.status.title")}>
          {statusTotal === 0 ? (
            <Empty>{t("overview.status.empty")}</Empty>
          ) : (
            <ul className="space-y-3.5">
              {STATUS_ORDER.map((status) => {
                const count = overview.bookingsByStatus[status] ?? 0;
                return (
                  <li key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(`overview.status.${status}`)}</span>
                      <span className="font-semibold text-foreground">{format.number(count)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-1.5 rounded-full ${STATUS_TONE[status]}`} style={{ width: `${(count / statusTotal) * 100}%` }} aria-hidden="true" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <Panel
          title={t("overview.agencies.title")}
          className="xl:col-span-3"
          action={
            <Link href="/tenants" className="text-xs font-medium text-primary hover:underline">
              {t("overview.agencies.viewAll")}
            </Link>
          }
        >
          {overview.recentAgencies.length === 0 ? (
            <Empty>{t("overview.agencies.empty")}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.agency")}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.plan")}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.joined")}</th>
                    <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.customers")}</th>
                    <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.bookings")}</th>
                    <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.revenue")}</th>
                    <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {overview.recentAgencies.map((agency) => (
                    <tr key={agency.id}>
                      <td className="max-w-[14rem] truncate px-3 py-3 font-medium text-foreground">{agency.name}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {t(PLAN_KEYS[agency.plan ?? "none"] ?? "overview.plan.none")}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{format.date(agency.createdAt)}</td>
                      <td className="px-3 py-3 text-center">{format.number(agency.customers)}</td>
                      <td className="px-3 py-3 text-center">{format.number(agency.bookings)}</td>
                      <td className="px-3 py-3 text-center font-medium">{format.number(agency.revenue)}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            agency.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                          }`}
                        >
                          {agency.isActive ? t("overview.agencies.active") : t("overview.agencies.inactive")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title={t("overview.activity.title")}>
          {overview.activity.length === 0 ? (
            <Empty>{t("overview.activity.empty")}</Empty>
          ) : (
            <ul className="space-y-3.5">
              {overview.activity.map((event, index) => (
                <li key={`${event.kind}-${event.at}-${index}`} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ACTIVITY_TONE[event.kind]}`} aria-hidden="true">
                    {ACTIVITY_ICON[event.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t(`overview.activity.${event.kind}`, { amount: format.number(event.amount ?? 0) })}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{event.agency}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    <RelativeTime iso={event.at} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title={t("overview.summary.title")}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("overview.summary.thisMonth"), value: overview.thisMonth.revenue, trend: monthTrend(overview.thisMonth.revenue, overview.lastMonth.revenue) },
            { label: t("overview.summary.collected"), value: overview.thisMonth.collected, trend: monthTrend(overview.thisMonth.collected, overview.lastMonth.collected) },
            { label: t("overview.summary.outstanding"), value: outstanding, trend: undefined },
            {
              label: t("overview.summary.avgBooking"),
              value: overview.bookings > 0 ? Math.round(overview.revenue / overview.bookings) : null,
              trend: undefined,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 p-4 text-center">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1.5 text-xl font-bold text-foreground">
                {item.value === null ? (
                  "—"
                ) : (
                  <>
                    {format.number(item.value)} <span className="text-xs font-normal text-muted-foreground">{currency}</span>
                  </>
                )}
              </dd>
              {item.trend ? (
                <p className={`mt-1 text-xs font-medium ${item.trend.direction === "up" ? "text-success" : "text-danger"}`}>
                  <LtrText>{`${item.trend.direction === "up" ? "↑" : "↓"} ${item.trend.value}`}</LtrText>{" "}
                  <span className="font-normal text-muted-foreground">{vsLastMonth}</span>
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
