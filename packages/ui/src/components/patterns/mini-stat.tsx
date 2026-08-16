import type { ReactNode } from "react";
import { cn } from "@travio/utils";
import { Skeleton } from "../skeleton";

export type MiniStatTone = "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<MiniStatTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export interface MiniStatProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: MiniStatTone;
  isLoading?: boolean;
}

// Design System v2.4 (Product-8.1): StatsCard is a top-level, bordered/
// shadowed Card of its own - correct at the page level (AnalyticsMetrics'
// KPI grid) but wrong nested inside another Card (the dashboard home
// snapshot cards previously nested StatsCard inside CardContent, a
// "box inside a box" double-border/double-shadow effect at odds with
// this phase's "minimal borders" brief). MiniStat is the borderless
// sibling for exactly that nested case - same icon-chip + label + value
// shape, no Card wrapper of its own, meant to sit directly inside an
// existing CardContent.
export function MiniStat({ label, value, icon, tone = "primary", isLoading }: MiniStatProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {icon ? (
        <span
          aria-hidden="true"
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}
