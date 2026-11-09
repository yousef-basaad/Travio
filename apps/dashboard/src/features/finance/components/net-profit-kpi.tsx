"use client";

import { CircleDollarSign } from "lucide-react";
import { KpiCard } from "@travio/ui";
import { useSession } from "@travio/auth";
import { useDashboardStats, useRevenueOverview } from "@/features/analytics";
import { FINANCE_ROLES } from "@/lib/auth/domain-roles";
import { trendFrom } from "@/lib/analytics/trend";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import { useExpenseTotal } from "../api/expenses.api";
import { useFinanceInsights } from "../api/finance-insights.api";

const SPARK_MONTHS = 6;

// Net profit (payments received minus expenses) for the Reports page -
// the same figure as the Finance page's net income. Expenses are finance
// data, so other roles get no card at all rather than a profit that
// leaves expenses out.
export function NetProfitKpi() {
  const t = useT();
  const format = useFormat();
  const { profile } = useSession();
  const allowed = profile ? (FINANCE_ROLES as readonly string[]).includes(profile.role) : false;
  const stats = useDashboardStats();
  const revenue = useRevenueOverview();
  const expenseTotal = useExpenseTotal({ enabled: allowed });
  const insights = useFinanceInsights({ enabled: allowed });

  if (!allowed) return null;

  const isLoading = stats.isLoading || expenseTotal.isLoading;
  const ready = stats.data && expenseTotal.data !== undefined;
  const months = (revenue.data?.months ?? []).slice(-SPARK_MONTHS);
  const expenses = new Map((insights.data?.expensesByMonth ?? []).map((month) => [month.month, month.expenseTotal]));
  const net = insights.data ? months.map((month) => month.paidTotal - (expenses.get(month.month) ?? 0)) : undefined;
  const trend = net ? trendFrom(net) : undefined;

  return (
    <KpiCard
      label={t("reports.kpi.profit")}
      value={ready ? format.number(stats.data!.paidAmount - expenseTotal.data!) : "—"}
      unit={ready ? t("common.currencySar") : undefined}
      icon={<CircleDollarSign size={20} />}
      tone="primary"
      isLoading={isLoading}
      sparkline={net}
      trend={trend}
      trendContext={trend ? t("home.kpi.vsLastMonth") : undefined}
    />
  );
}
