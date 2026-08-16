import type { BookingStatus } from "@travio/types";
import { cn } from "@travio/utils";

// Mirrors apps/dashboard's BookingStatusBadge exactly (same 5 values,
// same design-system tokens) - status label/style maps are always
// colocated with the feature that owns the domain in this codebase
// (BookingStatusBadge, LeadStatusBadge, invoice status styles all live
// app-local, never in a shared package), so this small presentational
// duplication across the two apps matches the established convention
// rather than breaking it.
const STATUS_STYLES: Record<BookingStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  pending: "bg-accent text-accent-foreground",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-danger/10 text-danger",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
