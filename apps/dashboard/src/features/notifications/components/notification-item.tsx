import { Button, ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { cn, formatRelativeTime } from "@travio/utils";
import type { Notification } from "@travio/api";

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}

export function NotificationItem({ notification, onMarkRead, isMarkingRead }: NotificationItemProps) {
  const isUnread = notification.readAt === null;

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
            aria-label={`Mark "${notification.title}" as read`}
          >
            {isMarkingRead ? "Marking…" : "Mark read"}
          </Button>
        ) : null}
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
