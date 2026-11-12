"use client";

import { Card, CardContent, CardHeader, InfoRow, PageHeader, Skeleton } from "@travio/ui";
import { useI18n, useT } from "@/lib/i18n/i18n-provider";
import { useProfile } from "../api/profile.api";

function ProfileSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("profile.loading")} className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ProfileErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      {t("profile.error")}
    </div>
  );
}

// Reuses customerService.getById (via GET /api/profile ->
// customers_customer_access RLS) - the exact same Customer shape the
// dashboard's own CustomerProfileCard reads, just read-only here (no
// edit flow this phase) and scoped to fields relevant to the customer
// themselves. Deliberately omits notes/assignedTo/branchId/tenantId -
// those are internal agency-side fields, never surfaced to the customer
// they're about.
export function ProfileView() {
  const { data: customer, isLoading, isError } = useProfile();
  const { t, format } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader title={t("profile.title")} description={t("profile.description")} />

      {isLoading ? (
        <ProfileSkeleton />
      ) : isError || !customer ? (
        <ProfileErrorState />
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">{customer.fullName}</h2>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label={t("profile.email")} value={customer.email ? <span dir="ltr">{customer.email}</span> : "—"} />
              <InfoRow label={t("profile.phone")} value={customer.phone ? <span dir="ltr">{customer.phone}</span> : "—"} />
              <InfoRow label={t("profile.nationality")} value={customer.nationality ?? "—"} />
              <InfoRow label={t("profile.preferredLanguage")} value={customer.preferredLanguage ?? "—"} />
              <InfoRow label={t("profile.passportNumber")} value={customer.passportNumber ? <span dir="ltr">{customer.passportNumber}</span> : "—"} />
              <InfoRow
                label={t("profile.passportExpiry")}
                value={customer.passportExpiry ? format.date(customer.passportExpiry) : "—"}
              />
              <InfoRow
                label={t("profile.dateOfBirth")}
                value={customer.dateOfBirth ? format.date(customer.dateOfBirth) : "—"}
              />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
