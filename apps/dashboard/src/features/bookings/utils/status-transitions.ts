import type { BookingStatus } from "@travio/types";

// The status changes the database allows (20261112130000). Kept in step
// with booking_check_status_change() so the picker only offers moves that
// will be accepted.
const NEXT: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ["pending", "confirmed", "cancelled"],
  pending: ["draft", "confirmed", "cancelled"],
  confirmed: ["pending", "completed", "cancelled"],
  completed: ["confirmed"],
  cancelled: ["draft"],
};

const ORDER: readonly BookingStatus[] = ["draft", "pending", "confirmed", "completed", "cancelled"];

/** The current status plus every status it can move to, in display order. */
export function statusOptions(current: BookingStatus): BookingStatus[] {
  return ORDER.filter((status) => status === current || NEXT[current].includes(status));
}

export function canChangeStatus(from: BookingStatus, to: BookingStatus): boolean {
  return from === to || NEXT[from].includes(to);
}
