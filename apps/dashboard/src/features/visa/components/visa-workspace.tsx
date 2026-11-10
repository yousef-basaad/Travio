"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, FilePen, Plus, Send, Stamp } from "lucide-react";
import {
  Avatar,
  BarList,
  Button,
  Card,
  DataTableState,
  DonutChart,
  KpiCard,
  PageHeader,
  SearchInput,
  SkeletonCard,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@travio/ui";
import { cn } from "@travio/utils";
import { useSession } from "@travio/auth";
import type { UserRole } from "@travio/types";
import type { VisaApplicationWithCustomer, VisaStatus } from "@travio/api";
import { EditVisaDialog, VISA_STATUS_KEYS, VisaStatusBadge, useVisaApplicationsPage } from "@/features/customers";
import { AppPagination } from "@/components/app-pagination";

type VisaStatusFilter = VisaStatus | "all";
const PAGE_SIZE = 25;
import { approvalRate } from "../utils/visa-stats";
import { trendFrom } from "@/lib/analytics/trend";
import { useVisaCenterStats } from "../api/visa-center.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const COLUMNS: MessageKey[] = [
  "common.customer",
  "visa.country",
  "visa.visaType",
  "visaCenter.submitted",
  "visaCenter.travelDate",
  "common.status",
];
const STATUS_OPTIONS: VisaStatus[] = ["draft", "submitted", "approved", "rejected"];

// Status colors, shared by the KPI cards and the status chart.
const STATUS_TONE: Record<VisaStatus, { tone: "info" | "warning" | "success" | "danger"; color: string }> = {
  draft: { tone: "info", color: "hsl(var(--info))" },
  submitted: { tone: "warning", color: "hsl(var(--warning))" },
  approved: { tone: "success", color: "hsl(var(--success))" },
  rejected: { tone: "danger", color: "hsl(var(--danger))" },
};
const STATUS_ICON: Record<VisaStatus, React.ReactNode> = {
  draft: <FilePen size={20} />,
  submitted: <Send size={20} />,
  approved: <CircleCheck size={20} />,
  rejected: <CircleX size={20} />,
};

// Same list as CUSTOMERS_ROLES in lib/auth/require-domain-access.ts:
// only these roles can open Customer 360, so only they get a link.
const CUSTOMER_PAGE_ROLES: readonly UserRole[] = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
];

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </Card>
  );
}

// The Visa Center (TRAVIO design 05): status KPIs, the applications list
// with status tabs, and side panels for visa types, top countries and
// quick numbers. Numbers come from visa_center_stats (counted in
// Postgres under the caller's RLS); the list is every application the
// caller may see, searchable, each editable with the Customer 360 dialog.
// New applications are added from the customer's profile, where the
// customer is chosen.
export function VisaWorkspace() {
  const t = useT();
  const format = useFormat();
  const { profile } = useSession();
  const { data: stats, isLoading: isLoadingStats } = useVisaCenterStats();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VisaStatusFilter>("all");
  const [editingVisa, setEditingVisa] = useState<VisaApplicationWithCustomer | null>(null);

  const canOpenCustomer = profile ? CUSTOMER_PAGE_ROLES.includes(profile.role) : false;
  const isFiltering = query.trim() !== "" || status !== "all";

  // Search is sent to the server a moment after typing stops.
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError } = useVisaApplicationsPage({
    page,
    pageSize: PAGE_SIZE,
    search,
    status: status === "all" ? undefined : status,
  });
  const filtered = data?.items ?? [];

  const totalTrend = stats ? trendFrom([stats.newLastMonth, stats.newThisMonth]) : undefined;
  const rate = stats ? approvalRate(stats.byStatus) : null;

  const tabs: { value: VisaStatusFilter; label: string; count: number | undefined }[] = [
    { value: "all", label: t("visaCenter.allStatuses"), count: stats?.total },
    ...STATUS_OPTIONS.map((option) => ({
      value: option,
      label: t(VISA_STATUS_KEYS[option]),
      count: stats?.byStatus[option],
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.visa")} description={t("visaCenter.description")} />

      {isLoadingStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label={t("visaCenter.kpi.total")}
            value={format.number(stats.total)}
            icon={<Stamp size={20} />}
            tone="primary"
            trend={totalTrend}
            trendContext={t("visaCenter.kpi.newThisMonth", { count: stats.newThisMonth })}
          />
          {STATUS_OPTIONS.map((option) => (
            <KpiCard
              key={option}
              label={t(VISA_STATUS_KEYS[option])}
              value={format.number(stats.byStatus[option])}
              icon={STATUS_ICON[option]}
              tone={STATUS_TONE[option].tone}
            />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">{t("visaCenter.tableLabel")}</h2>
              <SearchInput
                placeholder={t("visaCenter.searchPlaceholder")}
                aria-label={t("visaCenter.searchLabel")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                containerClassName="w-full sm:max-w-xs"
              />
            </div>

            <div role="group" aria-label={t("visaCenter.filterLabel")} className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={status === tab.value}
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-fast",
                    status === tab.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined ? ` (${format.number(tab.count)})` : ""}
                </button>
              ))}
            </div>

            <DataTableState
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && filtered.length === 0}
              loadingLabel={t("visa.loading")}
              errorMessage={t("visa.error")}
              emptyMessage={isFiltering ? t("visaCenter.noMatch") : t("visa.empty")}
              emptyAction={
                !isFiltering && canOpenCustomer ? (
                  <Button asChild variant="outline">
                    <Link href="/customers">{t("visaCenter.emptyHint")}</Link>
                  </Button>
                ) : undefined
              }
              emptyIcon={<Stamp size={20} />}
            >
              <Table aria-label={t("visaCenter.tableLabel")} caption={t("visaCenter.tableCaption")}>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((column) => (
                      <TableCell key={column} header>
                        {t(column)}
                      </TableCell>
                    ))}
                    <TableCell header>
                      <span className="sr-only">{t("common.actions")}</span>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((visa) => {
                    const customerName = visa.customer?.fullName ?? t("visaCenter.unknownCustomer");
                    return (
                      <TableRow key={visa.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={customerName} size="sm" />
                            {canOpenCustomer && visa.customer ? (
                              <Link
                                href={`/customers/${visa.customer.id}`}
                                className="truncate font-medium text-foreground hover:text-primary"
                              >
                                {customerName}
                              </Link>
                            ) : (
                              <span className="truncate font-medium text-foreground">{customerName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{visa.country ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{visa.visaType ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {visa.submittedAt ? format.date(visa.submittedAt) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {visa.travelDate ? format.date(visa.travelDate) : "—"}
                        </TableCell>
                        <TableCell>{visa.status ? <VisaStatusBadge status={visa.status} /> : "—"}</TableCell>
                        <TableCell align="end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVisa(visa)}
                            aria-label={t("visaCenter.editFor", { name: customerName })}
                          >
                            {t("common.edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </DataTableState>
            <AppPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
          </Card>

          {stats && stats.total > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <RailCard title={t("visaCenter.statusChart")}>
                <DonutChart
                  size={120}
                  centerValue={format.number(stats.total)}
                  centerLabel={t("common.total")}
                  segments={STATUS_OPTIONS.map((option) => ({
                    label: t(VISA_STATUS_KEYS[option]),
                    value: stats.byStatus[option],
                    color: STATUS_TONE[option].color,
                  }))}
                />
              </RailCard>
              <RailCard title={t("visaCenter.quickStats")}>
                <dl className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("visaCenter.approvalRate"), value: rate === null ? "—" : `${rate}%` },
                    { label: t("visaCenter.newThisMonth"), value: format.number(stats.newThisMonth) },
                    { label: t("visaCenter.decided"), value: format.number(stats.byStatus.approved + stats.byStatus.rejected) },
                    { label: t("visaCenter.inProgress"), value: format.number(stats.byStatus.draft + stats.byStatus.submitted) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/60 p-3 text-center">
                      <dd className="text-heading-sm font-bold text-foreground">{item.value}</dd>
                      <dt className="mt-0.5 text-xs text-muted-foreground">{item.label}</dt>
                    </div>
                  ))}
                </dl>
              </RailCard>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="space-y-3 bg-primary p-5 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                <Plus size={20} aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold">{t("visaCenter.newRequest")}</h2>
            </div>
            <p className="text-xs text-primary-foreground/80">{t("visaCenter.newRequestHint")}</p>
            {canOpenCustomer ? (
              <Button asChild variant="secondary" className="w-full">
                <Link href="/customers">{t("visaCenter.chooseCustomer")}</Link>
              </Button>
            ) : null}
          </Card>

          <RailCard title={t("visaCenter.visaTypes")}>
            {stats && stats.byType.length > 0 ? (
              <ul className="space-y-2.5">
                {stats.byType.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{item.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t("visaCenter.requests", { count: format.number(item.count) })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t("visaCenter.noData")}</p>
            )}
          </RailCard>

          <RailCard title={t("visaCenter.topCountries")}>
            {stats && stats.byCountry.length > 0 ? (
              <BarList
                rows={stats.byCountry.map((item) => ({
                  label: item.label,
                  value: item.count,
                  barClassName: "bg-primary",
                }))}
              />
            ) : (
              <p className="text-xs text-muted-foreground">{t("visaCenter.noData")}</p>
            )}
          </RailCard>
        </div>
      </div>

      {editingVisa && (
        <EditVisaDialog
          visa={editingVisa}
          customerId={editingVisa.customerId}
          open={editingVisa !== null}
          onOpenChange={(open) => {
            if (!open) setEditingVisa(null);
          }}
        />
      )}
    </div>
  );
}
