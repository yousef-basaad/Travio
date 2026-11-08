"use client";

import Link from "next/link";
import { BarChart3, CircleCheck, PieChart } from "lucide-react";
import { Card, DataTableState, DonutChart, LtrText } from "@travio/ui";
import { useRevenueOverview } from "@/features/analytics";
import { useFinanceInsights } from "../api/finance-insights.api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";

const CHART_MONTHS = 6;
const CATEGORY_SLICES = 5;
const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--danger))",
  "hsl(var(--muted-foreground))",
];

function InsightCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

// "الإيرادات vs المصروفات" from the TRAVIO design (06): paid revenue and
// expenses side by side for the last 6 months. Plain bars (no chart
// library); each bar carries its value as a tooltip and the legend and
// month labels carry the meaning.
export function RevenueVsExpenses() {
  const { t, locale, format } = useI18n();
  const revenue = useRevenueOverview();
  const insights = useFinanceInsights();
  const tag = intlLocale(locale);
  const monthLabel = new Intl.DateTimeFormat(tag, { month: "short", timeZone: "UTC" });

  const months = (revenue.data?.months ?? []).slice(-CHART_MONTHS);
  const expenses = new Map((insights.data?.expensesByMonth ?? []).map((month) => [month.month, month.expenseTotal]));
  const rows = months.map((month) => ({
    month: month.month,
    paid: month.paidTotal,
    expense: expenses.get(month.month) ?? 0,
  }));
  const max = Math.max(1, ...rows.flatMap((row) => [row.paid, row.expense]));
  const totals = rows.reduce((sum, row) => ({ paid: sum.paid + row.paid, expense: sum.expense + row.expense }), {
    paid: 0,
    expense: 0,
  });
  const isEmpty = rows.every((row) => row.paid === 0 && row.expense === 0);

  return (
    <InsightCard title={t("finance.chart.title")} description={t("finance.chart.description")}>
      <DataTableState
        isLoading={revenue.isLoading || insights.isLoading}
        isError={revenue.isError || insights.isError}
        errorMessage={t("finance.chart.error")}
        isEmpty={isEmpty}
        emptyMessage={t("finance.chart.empty")}
        emptyIcon={<BarChart3 size={20} />}
      >
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-success" aria-hidden="true" />
            {t("finance.chart.revenue")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-danger" aria-hidden="true" />
            {t("finance.chart.expenses")}
          </span>
        </div>
        <div className="flex h-44 items-end gap-3" role="img" aria-label={t("finance.chart.title")}>
          {rows.map((row) => (
            <div key={row.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div
                  className="w-1/3 max-w-4 rounded-t bg-success"
                  style={{ height: `${(row.paid / max) * 100}%` }}
                  title={`${t("finance.chart.revenue")}: ${format.number(row.paid)}`}
                />
                <div
                  className="w-1/3 max-w-4 rounded-t bg-danger"
                  style={{ height: `${(row.expense / max) * 100}%` }}
                  title={`${t("finance.chart.expenses")}: ${format.number(row.expense)}`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{monthLabel.format(new Date(`${row.month}-01T00:00:00Z`))}</span>
            </div>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
          {[
            { label: t("finance.chart.totalRevenue"), value: totals.paid, tone: "text-success" },
            { label: t("finance.chart.totalExpenses"), value: totals.expense, tone: "text-danger" },
            { label: t("finance.chart.net"), value: totals.paid - totals.expense, tone: "text-foreground" },
          ].map((item) => (
            <div key={item.label}>
              <dd className={`text-sm font-bold ${item.tone}`}>
                {format.number(item.value)} <span className="text-[10px] text-muted-foreground">{t("common.currencySar")}</span>
              </dd>
              <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
            </div>
          ))}
        </dl>
      </DataTableState>
    </InsightCard>
  );
}

// "توزيع المصروفات" (06): expenses by category - the largest five, the
// rest grouped as "Other".
export function ExpenseBreakdown() {
  const { t, format } = useI18n();
  const { data, isLoading, isError } = useFinanceInsights();
  const categories = data?.expensesByCategory ?? [];
  const total = categories.reduce((sum, category) => sum + category.total, 0);
  const top = categories.slice(0, CATEGORY_SLICES);
  const rest = categories.slice(CATEGORY_SLICES).reduce((sum, category) => sum + category.total, 0);
  const segments = [
    ...top.map((category, index) => ({
      label: category.category || t("finance.breakdown.uncategorized"),
      value: category.total,
      color: CATEGORY_COLORS[index] ?? "hsl(var(--muted-foreground))",
    })),
    ...(rest > 0 ? [{ label: t("finance.breakdown.other"), value: rest, color: CATEGORY_COLORS[CATEGORY_SLICES]! }] : []),
  ];

  return (
    <InsightCard title={t("finance.breakdown.title")} description={t("finance.breakdown.description")}>
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("finance.breakdown.error")}
        isEmpty={total === 0}
        emptyMessage={t("finance.breakdown.empty")}
        emptyIcon={<PieChart size={20} />}
      >
        <DonutChart
          size={120}
          className="sm:flex-col"
          centerValue={format.number(total)}
          centerLabel={t("common.currencySar")}
          formatValue={format.number}
          segments={segments}
        />
      </DataTableState>
    </InsightCard>
  );
}

// "المدفوعات المستحقة" (06): invoices past due that still owe money, most
// days late first.
export function OverdueInvoices() {
  const { t, format } = useI18n();
  const { data, isLoading, isError } = useFinanceInsights();
  const invoices = data?.overdueInvoices ?? [];

  return (
    <InsightCard title={t("finance.overdue.title")} description={t("finance.overdue.description")}>
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("finance.overdue.error")}
        isEmpty={invoices.length === 0}
        emptyMessage={t("finance.overdue.empty")}
        emptyIcon={<CircleCheck size={20} />}
      >
        <ul className="divide-y divide-border/60">
          {invoices.map((invoice) => (
            <li key={invoice.invoiceId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {invoice.customerName ?? t("finance.overdue.noCustomer")}
                </p>
                <p className="text-xs text-muted-foreground">
                  <LtrText>{invoice.invoiceNumber}</LtrText>
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-sm font-semibold text-danger">
                  {format.number(invoice.balance)} <span className="text-[10px]">{t("common.currencySar")}</span>
                </p>
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                  {t("finance.overdue.daysLate", { count: invoice.daysOverdue })}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/finance#invoices" className="mt-3 block text-center text-xs font-medium text-primary hover:underline">
          {t("finance.overdue.viewInvoices")}
        </Link>
      </DataTableState>
    </InsightCard>
  );
}
