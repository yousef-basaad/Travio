import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@travio/ui";
import type { Customer } from "@travio/api";

// Exported so customer-tabs.tsx's Overview tab reuses the same row
// layout rather than duplicating it - the two are sibling components
// under the Customer 360 shell (unlike lead-details.tsx, which keeps
// everything, including its own InfoRow, in a single file).
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

// Persistent identity summary (left column, always visible regardless of
// active tab) - deliberately shows fields the Overview tab doesn't
// (nationality/passport number) rather than duplicating its exact field
// list.
export function CustomerProfileCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">Profile</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label="Full Name" value={customer.fullName} />
          <InfoRow label="Email" value={customer.email ?? "—"} />
          <InfoRow label="Phone" value={customer.phone ?? "—"} />
          <InfoRow label="Nationality" value={customer.nationality ?? "—"} />
          <InfoRow label="Passport Number" value={customer.passportNumber ?? "—"} />
        </dl>
      </CardContent>
    </Card>
  );
}
