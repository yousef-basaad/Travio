import { TimelineItem } from "@travio/ui";
import type { CustomerTimelineItem as CustomerTimelineItemData } from "@travio/api";
import { formatDate, formatRelativeTime } from "@travio/utils";

// Centralized here - the only place customer timeline icons are mapped.
// A plain lookup (not a Record<CustomerTimelineItemType, string>) so a
// future item type the frontend doesn't know about yet falls back to the
// generic icon instead of failing to compile or render.
const CUSTOMER_TIMELINE_ICONS: Record<string, string> = {
  customer_created: "👤",
  lead_converted: "🔄",
};

const FALLBACK_ICON = "📌";

function getTimelineIcon(item: CustomerTimelineItemData): string {
  return CUSTOMER_TIMELINE_ICONS[item.type] ?? FALLBACK_ICON;
}

// customer_timeline has no actor/created_by concept (it's a synthesized
// composite of customer_created/lead_converted events - see
// customer-timeline.mapper.ts) - no actor is passed to TimelineItem
// here, never fabricated.
export function CustomerTimelineItem({
  item,
  isLast,
}: {
  item: CustomerTimelineItemData;
  isLast?: boolean;
}) {
  return (
    <TimelineItem
      icon={getTimelineIcon(item)}
      title={item.title}
      description={item.description}
      timestamp={formatRelativeTime(item.createdAt)}
      timestampTitle={formatDate(item.createdAt)}
      isLast={isLast}
    />
  );
}
