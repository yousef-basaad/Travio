import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@travio/utils";

export interface StatBadgeProps {
  /** Pre-formatted display string, e.g. "12%" - never computes a percentage itself. */
  value: string;
  direction: "up" | "down";
  className?: string;
}

// Design System v2.6 (Product-8.2 Operations Center Polish Pass 1): a
// tinted pill (was bare colored text) - exclusively used by KpiCard
// today, so this reads as "the KPI card trend badge" in scope terms even
// though it lives as its own primitive for whichever screen needs a
// standalone trend chip next (a table row, a list item).
export function StatBadge({ value, direction, className }: StatBadgeProps) {
  const tone = direction === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {direction === "up" ? (
        <ArrowUp size={11} aria-hidden="true" />
      ) : (
        <ArrowDown size={11} aria-hidden="true" />
      )}
      {value}
    </span>
  );
}
