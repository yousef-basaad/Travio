import { Card, CardContent, CardHeader, InfoRow, LtrText } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { Customer } from "@travio/api";

// Persistent identity summary (left column, always visible regardless of
// active tab). Phase UI-3: field list matches the Customer 360 spec
// exactly - Full Name/Email/Phone/Passport Expiry/Preferred Language/
// Assigned Agent. Nationality/Passport Number moved to the Overview tab
// (still shown there, not dropped) so this card stays a tight "who is
// this and who owns them" summary rather than the full profile dump.
export function CustomerProfileCard({ customer }: { customer: Customer }) {
  const t = useT();
  const format = useFormat();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium text-foreground">{t("customers.summary")}</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label={t("field.fullName")} value={customer.fullName} />
          <InfoRow label={t("field.email")} value={customer.email ?? "—"} />
          <InfoRow label={t("field.phone")} value={customer.phone ? <LtrText>{customer.phone}</LtrText> : "—"} />
          <InfoRow
            label={t("field.passportExpiry")}
            value={customer.passportExpiry ? format.date(customer.passportExpiry) : "—"}
          />
          <InfoRow label={t("field.preferredLanguage")} value={customer.preferredLanguage ?? "—"} />
          {/* Raw id, not a resolved name - no profiles join exists yet
              (same convention as every other assignedTo display in this
              app), never fabricated. */}
          <InfoRow label={t("field.assignedAgent")} value={customer.assignedTo ?? t("common.unassigned")} />
        </dl>
      </CardContent>
    </Card>
  );
}
