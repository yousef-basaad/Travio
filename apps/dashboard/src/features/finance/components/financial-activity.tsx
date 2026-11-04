"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  DataTableState,
  ServiceItem,
  ServiceItemHeader,
  ServiceItemContent,
} from "@travio/ui";
import { useInvoicesPage, usePaymentsPage } from "../api/invoices.api";
import { useExpensesPage } from "../api/expenses.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const ACTIVITY_LIMIT = 8;

type ActivityEvent = {
  id: string;
  at: string;
  label: string;
  amount: number;
  currency?: string;
};

// Not a dedicated activity/audit table (none exists) - this merges the
// newest ACTIVITY_LIMIT invoices, payments and expenses (each list is
// newest first) into one feed by date. That's enough: the latest
// ACTIVITY_LIMIT events overall are always among them.
const LATEST = { page: 1, pageSize: ACTIVITY_LIMIT };

export function FinancialActivity() {
  const t = useT();
  const format = useFormat();
  const invoicesQuery = useInvoicesPage(LATEST);
  const paymentsQuery = usePaymentsPage(LATEST);
  const expensesQuery = useExpensesPage(LATEST);

  const isLoading = invoicesQuery.isLoading || paymentsQuery.isLoading || expensesQuery.isLoading;
  const isError = invoicesQuery.isError || paymentsQuery.isError || expensesQuery.isError;

  const events: ActivityEvent[] = [
    ...(invoicesQuery.data?.items ?? []).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      at: invoice.createdAt,
      label: t("finance.activity.invoiceCreated", { number: invoice.invoiceNumber }),
      amount: invoice.total,
      currency: invoice.currency,
    })),
    ...(paymentsQuery.data?.items ?? [])
      .filter((payment) => payment.createdAt)
      .map((payment) => ({
        id: `payment-${payment.id}`,
        at: payment.createdAt as string,
        label: t("finance.activity.paymentReceived"),
        amount: payment.amount,
      })),
    ...(expensesQuery.data?.items ?? [])
      .filter((expense) => expense.createdAt)
      .map((expense) => ({
        id: `expense-${expense.id}`,
        at: expense.createdAt as string,
        label: t("finance.activity.expenseLogged", { title: expense.title }),
        amount: -expense.amount,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, ACTIVITY_LIMIT);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("finance.activity.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("finance.activity.subtitle")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={events.length === 0}
          loadingLabel={t("finance.activity.loading")}
          errorMessage={t("finance.activity.error")}
          emptyMessage={t("finance.activity.empty")}
          emptyIcon={<Activity size={20} />}
        >
          <ul className="space-y-2">
            {events.map((event) => (
              <ServiceItem key={event.id}>
                <ServiceItemHeader>
                  <span className="text-sm font-medium">{event.label}</span>
                  <span className={event.amount < 0 ? "text-sm text-danger" : "text-sm font-medium"}>
                    {event.amount < 0 ? "-" : ""}
                    {format.currency(Math.abs(event.amount), event.currency)}
                  </span>
                </ServiceItemHeader>
                <ServiceItemContent>
                  <p className="text-xs text-muted-foreground">{format.relativeTime(event.at)}</p>
                </ServiceItemContent>
              </ServiceItem>
            ))}
          </ul>
        </DataTableState>
      </CardContent>
    </Card>
  );
}
