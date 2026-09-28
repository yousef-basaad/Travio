import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface SectionToolbarProps {
  /** Left-aligned slot - typically a view/status filter select. */
  filters?: ReactNode;
  /** Right-aligned slot - typically search, sort, or a primary action. */
  actions?: ReactNode;
  className?: string;
}

// Design System v2.5 (Product-8.2 Phase 3): the reference's recurring
// "filter row above a list/board" bar (seen above the Kanban board here,
// and above the Visa Center/Finance tables in later phases) - a plain
// flex-wrap row with a filters slot and an actions slot, so each screen
// composes its own real controls into a consistently-spaced bar instead
// of a bespoke flex row per page.
export function SectionToolbar({ filters, actions, className }: SectionToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : <div />}
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
