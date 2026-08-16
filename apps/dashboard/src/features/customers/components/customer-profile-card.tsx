import { Card, CardContent, CardHeader, InfoRow } from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { Customer } from "@travio/api";

// Persistent identity summary (left column, always visible regardless of
// active tab). Phase UI-3: field list matches the Customer 360 spec
// exactly - Full Name/Email/Phone/Passport Expiry/Preferred Language/
// Assigned Agent. Nationality/Passport Number moved to the Overview tab
// (still shown there, not dropped) so this card stays a tight "who is
// this and who owns them" summary rather than the full profile dump.
export function CustomerProfileCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium text-foreground">Summary</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label="Full Name" value={customer.fullName} />
          <InfoRow label="Email" value={customer.email ?? "—"} />
          <InfoRow label="Phone" value={customer.phone ?? "—"} />
          <InfoRow
            label="Passport Expiry"
            value={customer.passportExpiry ? formatDate(customer.passportExpiry) : "—"}
          />
          <InfoRow label="Preferred Language" value={customer.preferredLanguage ?? "—"} />
          {/* Raw id, not a resolved name - no profiles join exists yet
              (same convention as every other assignedTo display in this
              app), never fabricated. */}
          <InfoRow label="Assigned Agent" value={customer.assignedTo ?? "Unassigned"} />
        </dl>
      </CardContent>
    </Card>
  );
}
