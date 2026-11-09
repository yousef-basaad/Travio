"use client";

import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn } from "@travio/utils";
import type { VisaApplication, VisaStatus } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Reuses only existing design tokens, matching LeadStatusBadge/
// BookingStatusBadge's approach - no new colors introduced.
// Message keys for the visa_status enum (draft/submitted/approved/
// rejected), shared by the badge, the create/edit selects and the Visa
// Center filter.
export const VISA_STATUS_KEYS: Record<VisaStatus, MessageKey> = {
  draft: "visa.status.draft",
  submitted: "visa.status.submitted",
  approved: "visa.status.approved",
  rejected: "visa.status.rejected",
};

const VISA_STATUS_STYLES: Record<VisaStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  submitted: "bg-accent text-accent-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-danger/10 text-danger",
};

// Shared by VisaItem and the Visa Center workspace table.
export function VisaStatusBadge({ status }: { status: VisaStatus }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        VISA_STATUS_STYLES[status],
      )}
    >
      {t(VISA_STATUS_KEYS[status])}
    </span>
  );
}

type VisaItemProps = {
  visa: VisaApplication;
  /**
   * Omitted entirely in Booking 360's read-only view (see VisaList's
   * bookingId mode) - visas are still only ever created/edited/deleted
   * from the Customer 360 tab, so this renders no actions column there
   * rather than a second edit/delete surface for the same row.
   */
  onEdit?: (visa: VisaApplication) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
};

export function VisaItem({ visa, onEdit, onDelete, isDeleting }: VisaItemProps) {
  const readOnly = !onEdit && !onDelete;
  const t = useT();
  const format = useFormat();

  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{visa.visaType ?? t("visa.unknownType")}</span>
          {visa.status && <VisaStatusBadge status={visa.status} />}
        </div>
        {!readOnly && (
          <ServiceItemActions>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(visa)}
                aria-label={t("visa.editLabel")}
              >
                {t("common.edit")}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(visa.id)}
                disabled={isDeleting}
                aria-label={t("visa.deleteLabel")}
              >
                {isDeleting ? t("common.deleting") : t("common.delete")}
              </Button>
            )}
          </ServiceItemActions>
        )}
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{visa.country ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {visa.submittedAt ? t("visa.submittedOn", { date: format.date(visa.submittedAt) }) : t("visa.notSubmitted")}
          {visa.createdAt ? ` · ${t("visa.createdOn", { date: format.date(visa.createdAt) })}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {/* Raw id, not a resolved name - no profiles join exists yet. */}
          {t("visa.assignedOfficer", { name: visa.assignedTo ?? t("common.unassigned") })}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
