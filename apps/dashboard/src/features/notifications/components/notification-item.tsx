import { Button, ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { cn } from "@travio/utils";
import type { Notification } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}

export function NotificationItem({ notification, onMarkRead, isMarkingRead }: NotificationItemProps) {
  const isUnread = notification.readAt === null;
  const t = useT();
  const format = useFormat();

  return (
    <ServiceItem className={cn(isUnread && "bg-accent/50")}>
      <ServiceItemHeader>
        <span className={cn("text-sm", isUnread ? "font-semibold" : "font-medium")}>
          {notification.title}
        </span>
        {isUnread ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(notification.id)}
            disabled={isMarkingRead}
            aria-label={t("notifications.markReadLabel", { title: notification.title })}
          >
            {isMarkingRead ? t("notifications.marking") : t("notifications.markRead")}
          </Button>
        ) : null}
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">{format.relativeTime(notification.createdAt)}</p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
