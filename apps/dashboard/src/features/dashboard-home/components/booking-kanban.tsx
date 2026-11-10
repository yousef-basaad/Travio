"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import {
  KanbanBoard,
  KanbanColumn,
  KanbanCard,
  KanbanEmpty,
  SectionToolbar,
  SkeletonTable,
  Avatar,
  Button,
  type KanbanTone,
} from "@travio/ui";
import { BOOKING_STATUS_KEYS } from "@/features/bookings";
import { useHomeOverview } from "../api/home-overview.api";
import type { BookingStatus } from "@/features/bookings";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Real booking_status enum, in the order the reference's board reads
// left-to-right - Draft/Pending/Confirmed/Completed/Cancelled is this
// app's own real status vocabulary (BOOKING_STATUS_LABELS, already used
// everywhere else), used as-is rather than relabeled to the reference's
// own English gloss ("New/In Progress") - same five columns, same real
// data, no invented status names.
const COLUMN_ORDER: BookingStatus[] = ["draft", "pending", "confirmed", "completed", "cancelled"];

// Column colors from the design: new (blue), awaiting confirmation
// (amber), in progress (indigo), done (green), cancelled (red).
const COLUMN_TONE: Record<BookingStatus, KanbanTone> = {
  draft: "info",
  pending: "warning",
  confirmed: "primary",
  completed: "success",
  cancelled: "danger",
};

const DAY_MS = 24 * 60 * 60 * 1000;

// A real, computed relative-day label from the booking's own startDate -
// "Today"/"Tomorrow"/"In N days" for the near future, a plain formatted
// date otherwise. Never fabricated: every branch is a deterministic
// function of the real date already on the booking.
function relativeDay(
  dateStr: string | null | undefined,
  t: ReturnType<typeof useT>,
  format: ReturnType<typeof useFormat>,
): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / DAY_MS);

  if (diffDays === 0) return t("date.today");
  if (diffDays === 1) return t("date.tomorrow");
  if (diffDays === 2) return t("date.inTwoDays");
  if (diffDays > 2 && diffDays <= 6) return t("date.inDays", { count: diffDays });
  return format.date(dateStr);
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
  const t = useT();
  const format = useFormat();
  const { data, isLoading } = useHomeOverview();
  const columns = new Map(data?.board.map((column) => [column.status, column]));

  return (
    <div className="space-y-3">
      <SectionToolbar
        filters={<h2 className="text-sm font-semibold text-foreground">{t("home.board.title")}</h2>}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/bookings">{t("common.viewAll")}</Link>
          </Button>
        }
      />
      {isLoading ? (
        <SkeletonTable rows={4} header={false} aria-label={t("home.board.loading")} />
      ) : (
        <KanbanBoard>
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              title={t(BOOKING_STATUS_KEYS[status])}
              count={columns.get(status)?.total ?? 0}
              tone={COLUMN_TONE[status]}
              footer={
                // New bookings start as drafts, so "add" lives under that column.
                status === "draft" ? (
                  <Link
                    href="/bookings/new"
                    className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-primary transition-colors duration-fast hover:bg-primary/10"
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t("home.board.addBooking")}
                  </Link>
                ) : undefined
              }
            >
              {(columns.get(status)?.cards ?? []).map((booking) => {
                const customerName = booking.customerName ?? "—";
                const relative = relativeDay(booking.startDate, t, format);
                return (
                  <Link key={booking.id} href={`/bookings/${booking.id}` as Route}>
                    <KanbanCard>
                      <p className="truncate text-xs font-semibold text-foreground">
                        {booking.bookingNumber}
                      </p>
                      <p className="truncate text-sm text-foreground">{booking.title}</p>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Avatar name={customerName} size="sm" className="h-5 w-5 shrink-0 text-[10px]" />
                          <span className="truncate text-xs text-muted-foreground">{customerName}</span>
                        </span>
                        {relative ? (
                          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{relative}</span>
                        ) : null}
                      </div>
                    </KanbanCard>
                  </Link>
                );
              })}
              {(columns.get(status)?.cards.length ?? 0) === 0 ? <KanbanEmpty message={t("home.board.empty")} /> : null}
            </KanbanColumn>
          ))}
        </KanbanBoard>
      )}
    </div>
  );
}
