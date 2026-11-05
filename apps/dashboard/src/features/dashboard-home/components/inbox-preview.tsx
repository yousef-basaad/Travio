"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { Widget, DataTableState, Button } from "@travio/ui";
import { useNotifications, notificationText } from "@/features/notifications";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const PREVIEW_LIMIT = 5;

// Design System v2.5 (Product-8.2 Phase 3): the reference's "Inbox"
// widget - per the approved scope decision ("do not create an inbox
// system, use the icon as a notification/activity shortcut only"), this
// reuses the real notifications data (useNotifications, the same hook
// the header's notification bell already fetches with) instead of a
// fabricated message list. "View all" links to the real /inbox
// placeholder page (Phase 2), which itself points back at the
// notification bell - never a dead link, never invented messages.
export function InboxPreview() {
  const t = useT();
  const format = useFormat();
  const { data: notifications, isLoading } = useNotifications();
  const recent = (notifications ?? []).slice(0, PREVIEW_LIMIT);

  return (
    <Widget
      title={t("nav.inbox")}
      description={t("home.inbox.description")}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/inbox">{t("common.viewAll")}</Link>
        </Button>
      }
    >
      <DataTableState
        isLoading={isLoading}
        isError={false}
        isEmpty={recent.length === 0}
        emptyMessage={t("notifications.empty")}
        emptyIcon={<Inbox size={20} />}
      >
        <ul className="space-y-3">
          {recent.map((notification) => {
            const { title, message } = notificationText(notification, t);
            return (
              <li key={notification.id} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={
                    notification.readAt
                      ? "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-transparent"
                      : "bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{title}</p>
                  <p className="text-muted-foreground truncate text-xs">{message}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {format.relativeTime(notification.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      </DataTableState>
    </Widget>
  );
}
