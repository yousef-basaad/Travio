"use client";

import { Button, DataTableState } from "@travio/ui";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "../api/notifications.api";
import { NotificationItem } from "./notification-item";
import { useT } from "@/lib/i18n/i18n-provider";

export function NotificationList() {
  const { data: notifications, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const t = useT();

  const hasUnread = (notifications ?? []).some((notification) => notification.readAt === null);

  return (
    <div className="w-80">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">{t("notifications.title")}</h2>
        {hasUnread ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {markAllRead.isPending ? t("notifications.marking") : t("notifications.markAllRead")}
          </Button>
        ) : null}
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!notifications || notifications.length === 0}
          skeletonRows={3}
          loadingLabel={t("notifications.loading")}
          errorMessage={t("notifications.error")}
          emptyMessage={t("notifications.empty")}
        >
          <ul className="space-y-1">
            {(notifications ?? []).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markRead.mutate(id)}
                isMarkingRead={markRead.isPending && markRead.variables === notification.id}
              />
            ))}
          </ul>
        </DataTableState>
      </div>
    </div>
  );
}
