import type { CrmTimelineItem } from "@travio/api";
import { formatDate, formatRelativeTime } from "@travio/utils";
import { ACTIVITY_ICONS } from "../activities/activity-item";
import { isCrmActivityType } from "../activities/create-activity-dialog";

const NON_ACTIVITY_ICONS: Record<Exclude<CrmTimelineItem["type"], "activity">, string> = {
  lead_created: "✨",
  note: "📝",
};

const FALLBACK_ACTIVITY_ICON = "📌";

// Single place this mapping is assembled: lead_created/note icons live
// here, and activity icons are reused from activity-item.tsx's own
// ACTIVITY_ICONS (the single source of truth for that mapping) rather
// than redefined.
function getTimelineIcon(item: CrmTimelineItem): string {
  if (item.type === "activity") {
    const activityType = item.metadata?.activityType;
    if (typeof activityType === "string" && isCrmActivityType(activityType)) {
      return ACTIVITY_ICONS[activityType];
    }
    return FALLBACK_ACTIVITY_ICON;
  }

  return NON_ACTIVITY_ICONS[item.type];
}

export function TimelineItem({ item }: { item: CrmTimelineItem }) {
  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      <span aria-hidden="true" className="text-lg leading-none">
        {getTimelineIcon(item)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
        )}
        <p className="text-xs text-muted-foreground" title={formatDate(item.createdAt)}>
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </li>
  );
}
