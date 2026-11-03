"use client";

import { History } from "lucide-react";
import { Timeline, EmptyState, Skeleton } from "@travio/ui";
import { useBookingTimeline } from "../../api/bookings.api";
import type { BookingTimelineEvent } from "../../types/booking";
import { BookingTimelineItem } from "./booking-timeline-item";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { Formatters } from "@/lib/i18n/format";

function TimelineSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("timeline.loading")} className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function TimelineErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      {t("timeline.error")}
    </div>
  );
}

function TimelineEmptyState() {
  const t = useT();
  return (
    <EmptyState
      icon={<History size={20} />}
      title={t("bookings.timeline.empty")}
      description={t("bookings.timeline.emptyDescription")}
    />
  );
}

// Product-2: groups already-sorted (newest-first, server-side) events
// into same-day buckets under a "Today"/"Yesterday"/dated heading - pure
// client-side presentation over the same fetched array, no re-sorting
// and no new data. Each bucket keeps the events already-descending order
// from the server, so buckets themselves are also naturally newest-first
// since the first event in each new bucket is the newest not yet
// assigned to one.
function groupByDay(
  events: BookingTimelineEvent[],
  format: Formatters,
  unknownDate: string,
): { label: string; events: BookingTimelineEvent[] }[] {
  const groups: { label: string; events: BookingTimelineEvent[] }[] = [];

  for (const event of events) {
    const label = event.createdAt ? format.dayLabel(event.createdAt) : unknownDate;
    const currentGroup = groups[groups.length - 1];

    if (currentGroup && currentGroup.label === label) {
      currentGroup.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }

  return groups;
}

// Bare (no Card wrapper), matching CustomerTimeline's shape exactly - this
// renders inside BookingTabs' own Card/CardContent as one of several
// tabs, not as a standalone page section. Ordering (newest first) is
// applied server-side by bookingTimelineService - never sorted here.
export function BookingTimeline({ bookingId }: { bookingId: string }) {
  const { data: timeline, isLoading, isError } = useBookingTimeline(bookingId);
  const t = useT();
  const format = useFormat();

  const hasItems = !isLoading && !isError && !!timeline && timeline.length > 0;

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (isError) {
    return <TimelineErrorState />;
  }

  if (!hasItems) {
    return <TimelineEmptyState />;
  }

  const groups = groupByDay(timeline, format, t("common.unknownDate"));

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <Timeline>
            {group.events.map((event, index) => (
              <BookingTimelineItem
                key={event.id}
                event={event}
                isLast={index === group.events.length - 1}
              />
            ))}
          </Timeline>
        </div>
      ))}
    </div>
  );
}
