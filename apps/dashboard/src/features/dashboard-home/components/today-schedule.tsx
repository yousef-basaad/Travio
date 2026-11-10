"use client";

import { CalendarClock, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { Widget, Timeline, TimelineItem, DataTableState } from "@travio/ui";
import { useHomeOverview } from "../api/home-overview.api";
import { useT } from "@/lib/i18n/i18n-provider";

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
  const t = useT();
  const { data, isLoading } = useHomeOverview();
  const events = data?.today ?? [];

  return (
    <Widget title={t("home.schedule.title")} description={t("home.schedule.description")}>
      <DataTableState
        isLoading={isLoading}
        isError={false}
        isEmpty={events.length === 0}
        emptyMessage={t("home.schedule.empty")}
        emptyIcon={<CalendarClock size={20} />}
      >
        <Timeline>
          {events.map((event, index) => (
            <TimelineItem
              key={`${event.kind}-${event.id}`}
              icon={event.kind === "departure" ? <PlaneTakeoff size={14} /> : <PlaneLanding size={14} />}
              title={event.title}
              description={
                event.kind === "departure"
                  ? t("home.schedule.departs", { number: event.bookingNumber })
                  : t("home.schedule.returns", { number: event.bookingNumber })
              }
              isLast={index === events.length - 1}
            />
          ))}
        </Timeline>
      </DataTableState>
    </Widget>
  );
}
