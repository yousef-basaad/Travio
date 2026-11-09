"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import { Button, Card, Dialog, EmptyState, LtrText, PageHeader, Pagination } from "@travio/ui";
import type { AgencyListItem, AgencyListPage, AgencyStatusFilter } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { setAgencyActive } from "../api/set-agency-active";
import { AGENCIES_PAGE_SIZE, agenciesHref, type AgencyParams } from "../utils/agency-params";

const FILTERS: readonly { value: AgencyStatusFilter; labelKey: MessageKey }[] = [
  { value: "all", labelKey: "agencies.filter.all" },
  { value: "active", labelKey: "agencies.filter.active" },
  { value: "inactive", labelKey: "agencies.filter.inactive" },
];

const PLAN_KEYS: Record<string, MessageKey> = {
  starter: "overview.plan.starter",
  business: "overview.plan.business",
  enterprise: "overview.plan.enterprise",
};

const SUBSCRIPTION_KEYS: Record<string, MessageKey> = {
  trialing: "agencies.subscription.trialing",
  active: "agencies.subscription.active",
  past_due: "agencies.subscription.past_due",
};

function DetailsDialog({ agency, onClose }: { agency: AgencyListItem; onClose: () => void }) {
  const { t } = useI18n();
  const none = t("agencies.none");
  const subscription = agency.subscriptionStatus ? SUBSCRIPTION_KEYS[agency.subscriptionStatus] : undefined;
  const rows: { label: string; value: string; ltr?: boolean }[] = [
    { label: t("agencies.detail.cr"), value: agency.crNumber ?? none, ltr: true },
    { label: t("agencies.detail.slug"), value: agency.slug, ltr: true },
    { label: t("agencies.detail.email"), value: agency.email ?? none, ltr: true },
    { label: t("agencies.detail.phone"), value: agency.phone ?? none, ltr: true },
    { label: t("agencies.detail.owner"), value: agency.ownerName ?? none },
    { label: t("agencies.detail.ownerEmail"), value: agency.ownerEmail ?? none, ltr: true },
    { label: t("agencies.detail.subscription"), value: subscription ? t(subscription) : t("overview.plan.none") },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} className="w-full max-w-md p-6">
      <h2 className="font-heading text-lg font-bold text-foreground">{agency.name}</h2>
      <dl className="mt-4 divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 truncate font-medium text-foreground">{row.ltr ? <LtrText>{row.value}</LtrText> : row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("agencies.detail.close")}
        </Button>
      </div>
    </Dialog>
  );
}

function ConfirmDialog({ agency, onClose }: { agency: AgencyListItem; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const deactivating = agency.isActive;

  const confirm = () =>
    startSaving(async () => {
      setFailed(false);
      const { ok } = await setAgencyActive(agency.id, !agency.isActive);
      if (!ok) {
        setFailed(true);
        return;
      }
      router.refresh();
      onClose();
    });

  return (
    <Dialog open preventClose={isSaving} onOpenChange={(open) => !open && onClose()} className="w-full max-w-md p-6">
      <h2 className="font-heading text-lg font-bold text-foreground">
        {t(deactivating ? "agencies.confirm.deactivateTitle" : "agencies.confirm.activateTitle", { name: agency.name })}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(deactivating ? "agencies.confirm.deactivateBody" : "agencies.confirm.activateBody")}
      </p>
      {failed ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {t("agencies.confirm.error")}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          {t("agencies.confirm.cancel")}
        </Button>
        <Button variant={deactivating ? "destructive" : "default"} onClick={confirm} disabled={isSaving}>
          {isSaving ? t("agencies.confirm.working") : t(deactivating ? "agencies.deactivate" : "agencies.activate")}
        </Button>
      </div>
    </Dialog>
  );
}

// Every agency on the platform: search, status filter, paging (all in
// the URL, read by the server page), details, and activate/deactivate
// behind a confirmation.
export function TenantsView({ data, params }: { data: AgencyListPage; params: AgencyParams }) {
  const { t, format } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState(params.search);
  const [details, setDetails] = useState<AgencyListItem | null>(null);
  const [confirming, setConfirming] = useState<AgencyListItem | null>(null);
  const [isNavigating, startNavigating] = useTransition();

  const go = (next: AgencyParams) => startNavigating(() => router.push(agenciesHref(next) as Route));
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    go({ ...params, search: search.trim(), page: 1 });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.agencies")} description={t("agencies.description")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md" role="search">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("agencies.search")}
              aria-label={t("agencies.search")}
              maxLength={100}
              className="w-full rounded-md border bg-background py-2 pe-3 ps-9 text-sm"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isNavigating}>
            {t("agencies.searchButton")}
          </Button>
        </form>
        <div role="group" aria-label={t("overview.agencies.status")} className="flex gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={params.status === filter.value}
              onClick={() => go({ ...params, status: filter.value, page: 1 })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                params.status === filter.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5">
        {data.items.length === 0 ? (
          <EmptyState icon={<Building2 size={20} />} title={t("agencies.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.agency")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("agencies.owner")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.plan")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("overview.agencies.joined")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("agencies.staff")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.customers")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.bookings")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.revenue")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("overview.agencies.status")}</th>
                  <th className="px-3 py-2.5 text-end font-medium">{t("agencies.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((agency) => (
                  <tr key={agency.id}>
                    <td className="max-w-[14rem] truncate px-3 py-3 font-medium text-foreground">{agency.name}</td>
                    <td className="max-w-[10rem] truncate px-3 py-3 text-muted-foreground">{agency.ownerName ?? t("agencies.none")}</td>
                    <td className="px-3 py-3">
                      <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {t((agency.plan && PLAN_KEYS[agency.plan]) || "overview.plan.none")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{format.date(agency.createdAt)}</td>
                    <td className="px-3 py-3 text-center">{format.number(agency.staff)}</td>
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
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setDetails(agency)}>
                          {t("agencies.details")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirming(agency)}>
                          {agency.isActive ? t("agencies.deactivate") : t("agencies.activate")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          className="mt-4"
          page={params.page}
          pageSize={AGENCIES_PAGE_SIZE}
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

      {details ? <DetailsDialog agency={details} onClose={() => setDetails(null)} /> : null}
      {confirming ? <ConfirmDialog agency={confirming} onClose={() => setConfirming(null)} /> : null}
    </div>
  );
}
