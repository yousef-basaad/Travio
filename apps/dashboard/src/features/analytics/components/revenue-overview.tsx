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
import { formatCurrency } from "@travio/utils";
import { useRevenueOverview } from "../api/analytics.api";

// Formats "YYYY-MM" as a short month label ("Jan", "Feb", ...) for the
// chart's x-axis - purely presentational, the underlying data (real
// revenue.months from analyticsService.getRevenueOverview) is untouched.
function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  if (!year || !monthNumber) return month;
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

// Design System v2.0 / Phase UI-2: line/area trend chart (packages/ui's
// TrendChart, no chart library dependency) replaces the previous plain
// table-with-bars rendering - "Revenue Trend" is a change-over-time
// question, which a trend line answers more directly than 12 table rows.
// The original table is kept as a "View as table" toggle (accessible
// alternative, same convention the dataviz guidance calls for), not
// removed.
export function RevenueOverview() {
  const { data: overview, isLoading, isError } = useRevenueOverview();
  const months = overview?.months ?? [];
  const [showTable, setShowTable] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
          <p className="text-xs text-muted-foreground">Invoiced vs. paid, last 12 months</p>
        </div>
        {months.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowTable((value) => !value)}>
            {showTable ? "View chart" : "View as table"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={months.length === 0}
          skeletonRows={4}
          loadingLabel="Loading revenue overview"
          errorMessage="Something went wrong loading the revenue overview. Please try again later."
          emptyMessage="No revenue data yet"
          emptyIcon={<TrendingUp size={20} />}
        >
          {showTable ? (
            <RevenueTable months={months} />
          ) : (
            <TrendChart
              labels={months.map((m) => formatMonthLabel(m.month))}
              valueFormatter={formatCurrency}
              series={[
                { name: "Paid", color: "hsl(var(--primary))", values: months.map((m) => m.paidTotal) },
                {
                  name: "Invoiced",
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
  const maxValue = Math.max(1, ...months.map((m) => Math.max(m.invoiceTotal, m.paidTotal)));

  return (
    <Table aria-label="Revenue by month" caption="Invoiced and paid totals per month for the last 12 months">
      <TableHeader>
        <TableRow className="text-muted-foreground">
          <TableCell header>Month</TableCell>
          <TableCell header>Invoiced</TableCell>
          <TableCell header>Paid</TableCell>
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
                <span className="whitespace-nowrap">{formatCurrency(m.invoiceTotal)}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(m.paidTotal / maxValue) * 100}%`, minWidth: "2px" }}
                />
                <span className="whitespace-nowrap">{formatCurrency(m.paidTotal)}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
