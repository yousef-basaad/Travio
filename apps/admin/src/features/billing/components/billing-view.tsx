"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, CircleCheck, CreditCard, Hourglass, Search } from "lucide-react";
import { Button, Card, EmptyState, KpiCard, PageHeader, Pagination } from "@travio/ui";
import type { PlatformSubscription, PlatformSubscriptionPage } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { BILLING_PAGE_SIZE, BILLING_STATUSES, billingHref, type BillingParams, type BillingStatusFilter } from "../utils/billing-params";

const ICON_SIZE = 20;

const STATUS_KEYS: Record<(typeof BILLING_STATUSES)[number], MessageKey> = {
  active: "billing.status.active",
  trialing: "billing.status.trialing",
  past_due: "billing.status.past_due",
  cancelled: "billing.status.cancelled",
  expired: "billing.status.expired",
  none: "billing.status.none",
};

const STATUS_TONE: Record<(typeof BILLING_STATUSES)[number], string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-info/10 text-info",
  past_due: "bg-warning/10 text-warning",
  cancelled: "bg-danger/10 text-danger",
  expired: "bg-danger/10 text-danger",
  none: "bg-muted text-muted-foreground",
};

const PLAN_KEYS: Record<string, MessageKey> = {
  starter: "overview.plan.starter",
  business: "overview.plan.business",
  enterprise: "overview.plan.enterprise",
};

function statusOf(row: PlatformSubscription): (typeof BILLING_STATUSES)[number] {
  return row.status && row.status in STATUS_KEYS ? (row.status as (typeof BILLING_STATUSES)[number]) : "none";
}

// Every agency's subscription and what active ones add up to at list
// price. There is no payment gateway yet, so nothing here is money
// collected, and the page says so. Read-only.
export function BillingView({ data, params }: { data: PlatformSubscriptionPage; params: BillingParams }) {
  const { t, format } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState(params.search);
  const [isNavigating, startNavigating] = useTransition();
  const none = t("agencies.none");

  const go = (next: BillingParams) => startNavigating(() => router.push(billingHref(next) as Route));
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    go({ ...params, search: search.trim(), page: 1 });
  };

  const priceText = (row: PlatformSubscription) => {
    if (row.price === null) return none;
    if (row.price === 0) return t("billing.customPrice");
    const amount = `${format.number(row.price)} ${t("common.currencySar")}`;
    return row.billingInterval === "yearly" ? t("billing.perYear", { amount }) : t("billing.perMonth", { amount });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.billing")} description={t("billing.description")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t("billing.kpi.mrr")}
          value={format.number(data.summary.expectedMrr)}
          unit={t("common.currencySar")}
          icon={<CreditCard size={ICON_SIZE} />}
          tone="primary"
          trendContext={t("billing.kpi.mrrContext")}
        />
        <KpiCard label={t("billing.status.active")} value={format.number(data.summary.active)} icon={<CircleCheck size={ICON_SIZE} />} tone="success" />
        <KpiCard label={t("billing.status.trialing")} value={format.number(data.summary.trialing)} icon={<Hourglass size={ICON_SIZE} />} tone="info" />
        <KpiCard label={t("billing.status.past_due")} value={format.number(data.summary.pastDue)} icon={<AlertTriangle size={ICON_SIZE} />} tone="warning" />
        <KpiCard label={t("billing.status.none")} value={format.number(data.summary.none)} icon={<Ban size={ICON_SIZE} />} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md" role="search">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("billing.search")}
              aria-label={t("billing.search")}
              maxLength={100}
              className="w-full rounded-md border bg-background py-2 pe-3 ps-9 text-sm"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isNavigating}>
            {t("agencies.searchButton")}
          </Button>
        </form>
        <select
          value={params.status}
          onChange={(event) => go({ ...params, status: event.target.value as BillingStatusFilter, page: 1 })}
          aria-label={t("overview.agencies.status")}
          disabled={isNavigating}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t("billing.allStatuses")}</option>
          {BILLING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(STATUS_KEYS[status])}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-5">
        {data.items.length === 0 ? (
          <EmptyState icon={<CreditCard size={20} />} title={t("billing.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.agency")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.plan")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("billing.price")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("billing.startsAt")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("billing.endsAt")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("billing.subscription")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((row) => {
                  const status = statusOf(row);
                  return (
                    <tr key={row.id}>
                      <td className="max-w-[16rem] px-3 py-3">
                        <p className="truncate font-medium text-foreground">{row.name}</p>
                        {row.isActive ? null : <p className="text-xs text-danger">{t("overview.agencies.inactive")}</p>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {row.plan ? (PLAN_KEYS[row.plan] ? t(PLAN_KEYS[row.plan]!) : row.plan) : none}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-foreground">{priceText(row)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{row.startsAt ? format.date(row.startsAt) : none}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{row.endsAt ? format.date(row.endsAt) : none}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>{t(STATUS_KEYS[status])}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          className="mt-4"
          page={params.page}
          pageSize={BILLING_PAGE_SIZE}
          total={data.total}
          disabled={isNavigating}
          onPageChange={(page) => go({ ...params, page })}
          labels={{
            navigation: t("pagination.label"),
            range: (from, to, total) => t("pagination.range", { from, to, total }),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (page, pages) => t("pagination.page", { page, pages }),
          }}
        />
      </Card>
    </div>
  );
}
