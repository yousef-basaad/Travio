import type { ReactNode } from "react";
import { CalendarPlus, Pencil, ArrowRightLeft, Circle } from "lucide-react";
import { TimelineItem } from "@travio/ui";
import type { BookingTimelineEvent, BookingTimelineEventType } from "../../types/booking";
import { formatDate, formatRelativeTime } from "@travio/utils";

// Centralized here - the only place booking timeline icons/titles are
// mapped. booking_timeline has no title column (see the migration), so
// the title is derived from type - a plain lookup (not a
// Record<BookingTimelineEventType, string>) so a future event type the
// frontend doesn't know about yet falls back to the generic icon/label
// instead of failing to compile or render, same reasoning as
// CustomerTimelineItem's icon map.
//
// Product-2: lucide-react icons (was emoji) - matches the icon
// vocabulary the rest of the design system already uses everywhere else
// (sidebar nav, StatsCard, EmptyState), which the emoji set predated.
const ICON_SIZE = 14;

const BOOKING_TIMELINE_ICONS: Record<string, ReactNode> = {
  booking_created: <CalendarPlus size={ICON_SIZE} />,
  booking_updated: <Pencil size={ICON_SIZE} />,
  status_changed: <ArrowRightLeft size={ICON_SIZE} />,
};

const BOOKING_TIMELINE_TITLES: Record<string, string> = {
  booking_created: "Booking created",
  booking_updated: "Booking updated",
  status_changed: "Status changed",
};

const FALLBACK_ICON = <Circle size={ICON_SIZE} />;

function getTimelineIcon(type: BookingTimelineEventType): ReactNode {
  return BOOKING_TIMELINE_ICONS[type] ?? FALLBACK_ICON;
}

function getTimelineTitle(type: BookingTimelineEventType): string {
  return BOOKING_TIMELINE_TITLES[type] ?? type;
}

export function BookingTimelineItem({
  event,
  isLast,
}: {
  event: BookingTimelineEvent;
  isLast?: boolean;
}) {
  return (
    <TimelineItem
      icon={getTimelineIcon(event.type)}
      title={getTimelineTitle(event.type)}
      description={event.description}
      timestamp={event.createdAt ? formatRelativeTime(event.createdAt) : null}
      timestampTitle={event.createdAt ? formatDate(event.createdAt) : undefined}
      // Raw id - no profiles join exists anywhere yet (same convention
      // as assignedTo elsewhere), never fabricated as a display name.
      actor={event.createdBy}
      isLast={isLast}
    />
  );
}
