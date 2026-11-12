"use client";

import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import type { VisaApplication, VisaStatus } from "@travio/api";
import { cn } from "@travio/utils";
import { useI18n } from "@/lib/i18n/i18n-provider";

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
  const { t, format } = useI18n();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{visa.visaType ?? t("visa.unknownType")}</span>
          {visa.status && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                VISA_STATUS_STYLES[visa.status],
              )}
            >
              {t(`visaStatus.${visa.status}`)}
            </span>
          )}
        </div>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{visa.country ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {visa.submittedAt ? t("visa.submittedOn", { date: format.date(visa.submittedAt) }) : t("visa.notSubmitted")}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
