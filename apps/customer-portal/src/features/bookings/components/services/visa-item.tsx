import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { VisaApplication, VisaStatus } from "@travio/api";
import { cn } from "@travio/utils";

const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

const VISA_STATUS_STYLES: Record<VisaStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  submitted: "bg-accent text-accent-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-danger/10 text-danger",
};

// Read-only counterpart to the dashboard's own VisaItem - deliberately
// omits assignedTo (an internal staff-routing field, not something a
// customer needs or should see).
export function VisaItem({ visa }: { visa: VisaApplication }) {
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{visa.visaType ?? "Unknown visa type"}</span>
          {visa.status && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                VISA_STATUS_STYLES[visa.status],
              )}
            >
              {VISA_STATUS_LABELS[visa.status]}
            </span>
          )}
        </div>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{visa.country ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {visa.submittedAt ? `Submitted ${formatDate(visa.submittedAt)}` : "Not submitted yet"}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
