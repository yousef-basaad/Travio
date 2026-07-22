import type { CustomerTimelineItem } from "@travio/api";
import { formatDate } from "@travio/utils";

// Centralized here - the only place customer timeline icons are mapped.
// A plain lookup (not a Record<CustomerTimelineItemType, string>) so a
// future item type the frontend doesn't know about yet falls back to the
// generic icon instead of failing to compile or render.
const CUSTOMER_TIMELINE_ICONS: Record<string, string> = {
  customer_created: "👤",
  lead_converted: "🔄",
};

const FALLBACK_ICON = "📌";

function getTimelineIcon(item: CustomerTimelineItem): string {
  return CUSTOMER_TIMELINE_ICONS[item.type] ?? FALLBACK_ICON;
}

// Same MDN "divisions" approach as features/leads/components/timeline/
// timeline-item.tsx - duplicated rather than shared cross-feature,
// matching this codebase's established per-feature self-containment
// (each feature keeps its own small presentational helpers rather than
// importing another feature's).
function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
    { amount: 4.34524, unit: "weeks" },
    { amount: 12, unit: "months" },
    { amount: Number.POSITIVE_INFINITY, unit: "years" },
  ];

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(Math.round(duration), "years");
}

export function CustomerTimelineItem({ item }: { item: CustomerTimelineItem }) {
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
