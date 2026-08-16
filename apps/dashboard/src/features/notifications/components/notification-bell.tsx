import { Bell } from "lucide-react";
import { Button, Badge } from "@travio/ui";

export interface NotificationBellProps {
  unreadCount: number;
}

// Icon-only trigger, matching the lucide-react iconography already used
// throughout the sidebar/StatsCard/EmptyState (Design System v2.1+) -
// aria-label carries the accessible name since the glyph alone can't.
// Design System v2.4 (Product-8.1): purely visual now - open/close is
// PopoverTrigger's job (NotificationCenter wraps this in one), no local
// onClick prop to wire.
export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      className="relative h-9 w-9 p-0"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
    >
      <Bell size={18} />
      {unreadCount > 0 ? (
        <Badge
          variant="danger"
          className="absolute -right-0.5 -top-0.5 px-1.5 py-0 text-[10px] leading-4"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      ) : null}
    </Button>
  );
}
