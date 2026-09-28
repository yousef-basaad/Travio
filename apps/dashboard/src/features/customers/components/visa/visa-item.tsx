import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn, formatDate } from "@travio/utils";
import type { VisaApplication, VisaStatus } from "@travio/api";

// Single source of truth for visa status labels - exported so
// create-visa-dialog.tsx/edit-visa-dialog.tsx reuse it for their
// <select> options instead of duplicating it. Matches the real
// visa_status enum (draft/submitted/approved/rejected).
export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

// Reuses only existing design tokens, matching LeadStatusBadge/
// BookingStatusBadge's approach - no new colors introduced.
const VISA_STATUS_STYLES: Record<VisaStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  submitted: "bg-accent text-accent-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-danger/10 text-danger",
};

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
        {!readOnly && (
          <ServiceItemActions>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(visa)}
                aria-label="Edit visa application"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(visa.id)}
                disabled={isDeleting}
                aria-label="Delete visa application"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </ServiceItemActions>
        )}
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{visa.country ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {visa.submittedAt ? `Submitted ${formatDate(visa.submittedAt)}` : "Not submitted yet"}
          {visa.createdAt ? ` · Created ${formatDate(visa.createdAt)}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {/* Raw id, not a resolved name - no profiles join exists yet. */}
          Assigned Officer: {visa.assignedTo ?? "Unassigned"}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
