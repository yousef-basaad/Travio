"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@travio/ui";
import { useNotifications } from "../api/notifications.api";
import { NotificationBell } from "./notification-bell";
import { NotificationList } from "./notification-list";

// Design System v2.4 (Product-8.1): migrated onto @travio/ui's new
// Popover (Radix-based) - was a hand-rolled toggle panel with its own
// document-level outside-click listener, the exact duplicated pattern
// (identical to DashboardHeader's own UserMenu) the Product-8 audit
// flagged by name. Popover (not DropdownMenu) since this hosts a
// scrollable list of arbitrary content, not a set of menu commands -
// role="menu" would have been the wrong semantics here even hand-rolled.
export function NotificationCenter() {
  const { data: notifications } = useNotifications();
  const unreadCount = (notifications ?? []).filter((notification) => notification.readAt === null).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <NotificationBell unreadCount={unreadCount} />
      </PopoverTrigger>
      <PopoverContent aria-label="Notifications" className="p-0">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
