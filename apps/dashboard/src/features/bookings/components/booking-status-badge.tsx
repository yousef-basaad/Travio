import type { BookingStatus } from "../types/booking";
import { cn } from "@travio/utils";

// Reuses only existing design tokens (secondary/accent/primary/destructive
// from packages/ui/src/styles/globals.css), matching LeadStatusBadge's
// approach - no new colors introduced. Exported (Product-2) so
// ChangeBookingStatus's <Select> can adopt the same per-status color
// instead of a plain, unstyled dropdown next to a colored badge.
export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  pending: "bg-accent text-accent-foreground",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-danger/10 text-danger",
};

// Exported so other bookings-related views (e.g. the analytics feature's
// BookingStatusCard) reuse the same label map instead of duplicating it.
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
        BOOKING_STATUS_STYLES[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
