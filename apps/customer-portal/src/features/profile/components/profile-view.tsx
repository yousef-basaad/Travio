"use client";

import { Card, CardContent, CardHeader, InfoRow, PageHeader, Skeleton } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useProfile } from "../api/profile.api";

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ProfileErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      Something went wrong loading your profile. Please try again later.
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

  return (
    <div className="space-y-4">
      <PageHeader title="My Profile" description="The information your agency has on file for you" />

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
              <InfoRow label="Email" value={customer.email ?? "—"} />
              <InfoRow label="Phone" value={customer.phone ?? "—"} />
              <InfoRow label="Nationality" value={customer.nationality ?? "—"} />
              <InfoRow label="Preferred Language" value={customer.preferredLanguage ?? "—"} />
              <InfoRow label="Passport Number" value={customer.passportNumber ?? "—"} />
              <InfoRow
                label="Passport Expiry"
                value={customer.passportExpiry ? formatDate(customer.passportExpiry) : "—"}
              />
              <InfoRow
                label="Date of Birth"
                value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : "—"}
              />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
