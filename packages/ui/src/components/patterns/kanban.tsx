import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface KanbanBoardProps {
  children: ReactNode;
  className?: string;
}

// The status board from the TRAVIO design (Operations Center's
// "لوحة الحجوزات"): columns share the available width equally and only
// scroll sideways once each would drop below 8.5rem. Purely structural:
// the caller maps its own records into KanbanColumn/KanbanCard.
export function KanbanBoard({ children, className }: KanbanBoardProps) {
  return (
    <div className={cn("grid auto-cols-[minmax(8.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2", className)}>
      {children}
    </div>
  );
}

export type KanbanTone = "neutral" | "info" | "warning" | "primary" | "success" | "danger";

// Column tint + title/badge color per tone, as the design colors each
// status column.
const TONE_CLASSES: Record<KanbanTone, { column: string; title: string; badge: string }> = {
  neutral: { column: "bg-surface-muted/70", title: "text-foreground", badge: "bg-muted text-muted-foreground" },
  info: { column: "bg-info/5", title: "text-info", badge: "bg-info/10 text-info" },
  warning: { column: "bg-warning/5", title: "text-warning", badge: "bg-warning/10 text-warning" },
  primary: { column: "bg-primary/5", title: "text-primary", badge: "bg-primary/10 text-primary" },
  success: { column: "bg-success/5", title: "text-success", badge: "bg-success/10 text-success" },
  danger: { column: "bg-danger/5", title: "text-danger", badge: "bg-danger/10 text-danger" },
};

export interface KanbanColumnProps {
  title: string;
  count: number;
  tone?: KanbanTone;
  children: ReactNode;
  /** Shown under the cards, e.g. an "add" link. */
  footer?: ReactNode;
  className?: string;
}

export function KanbanColumn({ title, count, tone = "neutral", children, footer, className }: KanbanColumnProps) {
  const toneClasses = TONE_CLASSES[tone];
  return (
    <div className={cn("flex min-w-0 flex-col rounded-xl border border-border/40 p-2.5", toneClasses.column, className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1 pt-0.5">
        <h3 className={cn("truncate text-sm font-semibold", toneClasses.title)}>{title}</h3>
        <span
          className={cn(
            "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium",
            toneClasses.badge,
          )}
        >
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-2">{children}</div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export interface KanbanCardProps {
  children: ReactNode;
  className?: string;
}

// A liftable card (shadow + hover lift). Deliberately no drag handle -
// dragging isn't implemented, so nothing should suggest it.
export function KanbanCard({ children, className }: KanbanCardProps) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border border-border/50 bg-card p-3 text-sm shadow-sm transition-all duration-base ease-default hover:-translate-y-0.5 hover:border-border/70 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface KanbanEmptyProps {
  message?: string;
}

// A dashed placeholder sized for one column.
export function KanbanEmpty({ message = "Nothing here" }: KanbanEmptyProps) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
