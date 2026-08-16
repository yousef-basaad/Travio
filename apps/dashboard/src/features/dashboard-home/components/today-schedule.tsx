"use client";

import { CalendarClock, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { Widget, Timeline, TimelineItem, DataTableState } from "@travio/ui";
import { useBookings } from "@/features/bookings";

// Design System v2.5 (Product-8.2 Phase 3): the reference's "Today's
// Schedule" widget shows calendar-style events (meetings, reviews) that
// have no backing feature in this codebase (no events/tasks table
// exists) - rather than fabricate meeting names, this keeps the same
// widget shape (a chronological Timeline of "today") populated with
// something real and genuinely date-relevant: bookings departing or
// returning today (startDate/endDate), the same useBookings() data
// every other booking view already fetches. Reuses the existing
// Timeline/TimelineItem primitive (Customer 360/Booking 360's own
// activity timelines) rather than a new "Activity Timeline" component -
// same shape, no duplication.
export function TodaySchedule() {
  const { data: bookings, isLoading } = useBookings();
  const today = new Date().toISOString().slice(0, 10);

  const departures = (bookings ?? [])
    .filter((b) => b.startDate === today)
    .map((b) => ({ booking: b, kind: "departure" as const }));
  const returns = (bookings ?? [])
    .filter((b) => b.endDate === today)
    .map((b) => ({ booking: b, kind: "return" as const }));
  const events = [...departures, ...returns];

  return (
    <Widget title="Today's Schedule" description="Bookings starting or ending today">
      <DataTableState
        isLoading={isLoading}
        isError={false}
        isEmpty={events.length === 0}
        emptyMessage="Nothing scheduled today"
        emptyIcon={<CalendarClock size={20} />}
      >
        <Timeline>
          {events.map((event, index) => (
            <TimelineItem
              key={`${event.kind}-${event.booking.id}`}
              icon={event.kind === "departure" ? <PlaneTakeoff size={14} /> : <PlaneLanding size={14} />}
              title={event.booking.title}
              description={
                event.kind === "departure"
                  ? `Departs today · ${event.booking.bookingNumber}`
                  : `Returns today · ${event.booking.bookingNumber}`
              }
              isLast={index === events.length - 1}
            />
          ))}
        </Timeline>
      </DataTableState>
    </Widget>
  );
}
