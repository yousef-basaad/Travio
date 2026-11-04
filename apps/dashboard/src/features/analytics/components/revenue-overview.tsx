"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  DataTableState,
  TrendChart,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { useRevenueOverview } from "../api/analytics.api";
import { useFormat, useI18n, useT } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";

// Formats "YYYY-MM" as a short month label ("Jan", "Feb", ...) for the
// chart's x-axis - purely presentational, the underlying data (real
// revenue.months from analyticsService.getRevenueOverview) is untouched.
function formatMonthLabel(month: string, localeTag: string): string {
  const [year, monthNumber] = month.split("-");
  if (!year || !monthNumber) return month;
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString(localeTag, { month: "short" });
}

// Design System v2.0 / Phase UI-2: line/area trend chart (packages/ui's
// TrendChart, no chart library dependency) replaces the previous plain
// table-with-bars rendering - "Revenue Trend" is a change-over-time
// question, which a trend line answers more directly than 12 table rows.
// The original table is kept as a "View as table" toggle (accessible
// alternative, same convention the dataviz guidance calls for), not
// removed.
export function RevenueOverview() {
  const t = useT();
  const { locale } = useI18n();
  const format = useFormat();
  const { data: overview, isLoading, isError } = useRevenueOverview();
  const months = overview?.months ?? [];
  const [showTable, setShowTable] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("analytics.revenue.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("analytics.revenue.subtitle")}</p>
        </div>
        {months.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowTable((value) => !value)}>
            {showTable ? t("analytics.revenue.viewChart") : t("analytics.revenue.viewTable")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={months.length === 0}
          skeletonRows={4}
          loadingLabel={t("analytics.revenue.loading")}
          errorMessage={t("analytics.revenue.error")}
          emptyMessage={t("analytics.revenue.empty")}
          emptyIcon={<TrendingUp size={20} />}
        >
          {showTable ? (
            <RevenueTable months={months} />
          ) : (
            <TrendChart
              labels={months.map((m) => formatMonthLabel(m.month, intlLocale(locale)))}
              valueFormatter={(value) => format.currency(value)}
              series={[
                { name: t("bookings.finance.paid"), color: "hsl(var(--primary))", values: months.map((m) => m.paidTotal) },
                {
                  name: t("analytics.revenue.invoiced"),
                  color: "hsl(var(--muted-foreground))",
                  values: months.map((m) => m.invoiceTotal),
                },
              ]}
            />
          )}
        </DataTableState>
      </CardContent>
    </Card>
  );
}

function RevenueTable({
  months,
}: {
  months: { month: string; invoiceTotal: number; paidTotal: number }[];
}) {
  const t = useT();
  const format = useFormat();
  const maxValue = Math.max(1, ...months.map((m) => Math.max(m.invoiceTotal, m.paidTotal)));

  return (
    <Table aria-label={t("analytics.revenue.byMonth")} caption={t("analytics.revenue.caption")}>
      <TableHeader>
        <TableRow className="text-muted-foreground">
          <TableCell header>{t("analytics.revenue.month")}</TableCell>
          <TableCell header>{t("analytics.revenue.invoiced")}</TableCell>
          <TableCell header>{t("bookings.finance.paid")}</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {months.map((m) => (
          <TableRow key={m.month}>
            <TableCell className="whitespace-nowrap font-medium">{m.month}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="h-2 rounded-full bg-muted-foreground/40"
                  style={{ width: `${(m.invoiceTotal / maxValue) * 100}%`, minWidth: "2px" }}
                />
                <span className="whitespace-nowrap">{format.currency(m.invoiceTotal)}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(m.paidTotal / maxValue) * 100}%`, minWidth: "2px" }}
                />
                <span className="whitespace-nowrap">{format.currency(m.paidTotal)}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
