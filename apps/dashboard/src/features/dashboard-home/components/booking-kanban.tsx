"use client";

import Link from "next/link";
import type { Route } from "next";
import { KanbanBoard, KanbanColumn, KanbanCard, KanbanEmpty, SectionToolbar, SkeletonTable, Avatar, Button } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useBookings, BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/features/bookings";
import { useCustomers } from "@/features/customers";
import type { BookingStatus } from "@/features/bookings";

// Real booking_status enum, in the order the reference's board reads
// left-to-right - Draft/Pending/Confirmed/Completed/Cancelled is this
// app's own real status vocabulary (BOOKING_STATUS_LABELS, already used
// everywhere else), used as-is rather than relabeled to the reference's
// own English gloss ("New/In Progress") - same five columns, same real
// data, no invented status names.
const COLUMN_ORDER: BookingStatus[] = ["draft", "pending", "confirmed", "completed", "cancelled"];

const DAY_MS = 24 * 60 * 60 * 1000;

// A real, computed relative-day label from the booking's own startDate -
// "Today"/"Tomorrow"/"In N days" for the near future, a plain formatted
// date otherwise. Never fabricated: every branch is a deterministic
// function of the real date already on the booking.
function relativeDay(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / DAY_MS);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 6) return `In ${diffDays} days`;
  return formatDate(dateStr);
}

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): the
// reference's dominant central widget - every real booking (useBookings(),
// the same hook BookingsTable/RecentBookings/UpcomingBookings already
// used), grouped by its real status. A toolbar now carries a real title
// ("Booking Board") and a real "View all" link to the existing /bookings
// list, matching the reference's own toolbar row - the reference also
// shows a status filter dropdown and a filter-icon button there, which
// this intentionally leaves out rather than ship a control that doesn't
// actually filter anything (the same "no fake functionality" standard
// GlobalSearch's own "not connected yet" state already applies here).
// Each card now shows a real relative-day chip (computed from the
// booking's own startDate, see relativeDay()) and the customer's avatar
// next to their name, matching the reference's card anatomy more closely
// than the previous plain text-only rows.
export function BookingKanban() {
  const { data: bookings, isLoading } = useBookings();
  const { data: customers } = useCustomers();
  const customerNameById = new Map(customers?.map((c) => [c.id, c.fullName]));

  const byStatus = new Map<BookingStatus, typeof bookings>();
  for (const status of COLUMN_ORDER) byStatus.set(status, []);
  for (const booking of bookings ?? []) {
    byStatus.get(booking.status)?.push(booking);
  }

  return (
    <div className="space-y-3">
      <SectionToolbar
        filters={<h2 className="text-sm font-semibold text-foreground">Booking Board</h2>}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings">View all</Link>
          </Button>
        }
      />
      {isLoading ? (
        <SkeletonTable rows={4} header={false} aria-label="Loading bookings" />
      ) : (
        <KanbanBoard>
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              title={BOOKING_STATUS_LABELS[status]}
              count={byStatus.get(status)?.length ?? 0}
              badgeClassName={BOOKING_STATUS_STYLES[status]}
            >
              {(byStatus.get(status) ?? []).map((booking) => {
                const customerName = customerNameById.get(booking.customerId) ?? "—";
                const relative = relativeDay(booking.startDate);
                return (
                  <Link key={booking.id} href={`/bookings/${booking.id}` as Route}>
                    <KanbanCard>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">{booking.bookingNumber}</p>
                        {relative ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {relative}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-muted-foreground">{booking.title}</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Avatar name={customerName} size="sm" className="h-5 w-5 text-[10px]" />
                        <span className="truncate text-xs text-muted-foreground">{customerName}</span>
                      </div>
                    </KanbanCard>
                  </Link>
                );
              })}
              {(byStatus.get(status) ?? []).length === 0 ? <KanbanEmpty message="No bookings" /> : null}
            </KanbanColumn>
          ))}
        </KanbanBoard>
      )}
    </div>
  );
}
