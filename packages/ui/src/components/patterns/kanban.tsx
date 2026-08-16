import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface KanbanBoardProps {
  children: ReactNode;
  className?: string;
}

// Design System v2.5 (Product-8.2 Phase 3): the reference's status-board
// pattern (Operations Center's "لوحة الحجوزات") - a horizontally
// scrolling row of fixed-width columns. Purely structural, like
// ServiceItem/Timeline before it: no awareness of what a "card" or
// "column" represents, the caller maps its own real records into
// KanbanColumn/KanbanCard.
//
// Polish Pass 1: gap widened (gap-4 -> gap-5) and bottom padding added
// (pb-3, was pb-2) so the horizontal scrollbar (on narrower viewports)
// doesn't sit flush against the columns' own bottom edge - both purely
// "more breathing room," no structural change.
export function KanbanBoard({ children, className }: KanbanBoardProps) {
  return <div className={cn("flex gap-5 overflow-x-auto pb-3", className)}>{children}</div>;
}

export interface KanbanColumnProps {
  title: string;
  count: number;
  /** Tailwind background class for the count badge - falls back to a neutral tone. */
  badgeClassName?: string;
  children: ReactNode;
  className?: string;
}

// Polish Pass 1: wider (w-72 -> w-80), more internal padding (p-3 ->
// p-3.5), a real header/body separation (a hairline border instead of
// just a margin gap) - the previous version read as "compressed"
// because the column's own chrome (background tint, header) carried
// almost no weight of its own; this gives the column shell more
// presence without changing what it contains.
export function KanbanColumn({ title, count, badgeClassName, children, className }: KanbanColumnProps) {
  return (
    <div className={cn("flex w-80 shrink-0 flex-col rounded-xl bg-surface-muted/70 p-3.5", className)}>
      <div className="mb-3 flex items-center justify-between border-b border-border/60 px-0.5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-xs font-medium",
            badgeClassName ?? "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export interface KanbanCardProps {
  children: ReactNode;
  className?: string;
}

// Polish Pass 1: stronger resting elevation (shadow -> was shadow-sm) and
// a hover lift (-translate-y-0.5, matching KpiCard's own micro-
// interaction) - a Trello/Linear-style card reads as a physical,
// liftable object mostly through shadow depth and a soft hover response,
// not a special cursor. Deliberately no `cursor-grab`/drag handle -
// dragging isn't implemented, and a grab affordance would promise an
// interaction this card doesn't have; the elevation alone gives the
// "premium, drag-ready" quality the brief asks for without that
// dishonesty. Softer border (border-border/50, was /60) so the shadow -
// not the outline - carries most of the "this is a card" signal.
export function KanbanCard({ children, className }: KanbanCardProps) {
  return (
    <div
      className={cn(
        "space-y-1.5 rounded-lg border border-border/50 bg-card p-3.5 text-sm shadow transition-all duration-base ease-default hover:-translate-y-0.5 hover:border-border/70 hover:shadow-lg",
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

// Polish Pass 1: a considered empty state (dashed placeholder box)
// instead of a bare line of muted text - sized for a single narrow
// column rather than the full-width EmptyState primitive (whose own
// p-8 padding doesn't fit an 320px column comfortably).
export function KanbanEmpty({ message = "Nothing here" }: KanbanEmptyProps) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
