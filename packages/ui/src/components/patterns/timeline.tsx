import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface TimelineProps {
  children: ReactNode;
  className?: string;
}

// Ordered list wrapper - callers map their own events to TimelineItem
// below, passing `isLast` on the final one so its connecting line is
// omitted. Shared by Customer 360's activity timeline and Booking 360's
// timeline (previously each hand-rolled its own bordered <li>, no
// connecting line) - this is the one generic piece both extract into
// packages/ui; the icon/title/description mapping per event type stays
// in each feature (customer_created vs. booking_created etc.).
export function Timeline({ children, className }: TimelineProps) {
  return <ol className={cn("space-y-0", className)}>{children}</ol>;
}

export interface TimelineItemProps {
  /** Rendered inside the dot marker - a single emoji/icon, kept small. */
  icon?: ReactNode;
  title: string;
  description?: string | null;
  /** Already-formatted display string (caller owns date formatting). */
  timestamp?: string | null;
  /** Full, unformatted timestamp for the `title` attribute tooltip. */
  timestampTitle?: string;
  /** Raw actor id/name - omitted entirely when not available (never fabricated). */
  actor?: string | null;
  /** Omit the connecting line below this item (the last one in the list). */
  isLast?: boolean;
}

export function TimelineItem({
  icon,
  title,
  description,
  timestamp,
  timestampTitle,
  actor,
  isLast = false,
}: TimelineItemProps) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[15px] top-8 w-px bg-border"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm leading-none"
      >
        {icon ?? "•"}
      </span>
      <div className="min-w-0 flex-1 space-y-1 pt-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {timestamp ? <span title={timestampTitle}>{timestamp}</span> : null}
          {actor ? <span>· {actor}</span> : null}
        </div>
      </div>
    </li>
  );
}
