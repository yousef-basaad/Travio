import type { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@travio/utils";
import { Card, CardContent, CardHeader } from "../card";
import { SkeletonCard } from "../skeleton";

export type StatsCardTone = "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<StatsCardTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export interface StatsCardTrend {
  /** Pre-formatted display string, e.g. "12%" - this component never computes a percentage itself. */
  value: string;
  direction: "up" | "down";
}

export interface StatsCardProps {
  label: string;
  value: string;
  /**
   * Design System v2.0 additions - every existing call site only passes
   * label/value and renders exactly as before; these are additive.
   */
  subtitle?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  /**
   * Design System v2.1: tints the icon chip using one of the existing
   * semantic status tokens (defaults to "primary") - matches the
   * reference design system's colored KPI icon chips (each stat's icon
   * gets its own tone) instead of one flat neutral gray for every card.
   * No new colors introduced - reuses the same success/warning/danger/
   * info tokens every status badge already uses.
   */
  tone?: StatsCardTone;
  /**
   * Design System v2.2: optional trend indicator (up/down + a
   * pre-formatted value, e.g. { value: "12%", direction: "up" }) shown
   * beside the subtitle. Nothing computes or fabricates this - a caller
   * only passes it when it already has a real period-over-period figure
   * to show (none of today's callers do yet, so this renders nothing
   * until one opts in).
   */
  trend?: StatsCardTrend;
}

// Formalizes the local StatCard the Analytics dashboard defined for
// itself (features/analytics/components/dashboard-stats.tsx) - same
// markup, now shared so other dashboards (bookings, finance) can reuse
// the exact same "label + big number" card. Design System v2.0 gives it
// an optional icon slot, subtitle line, and loading state (SkeletonCard);
// v2.1 adds an optional colored `tone` for the icon chip; v2.2 adds an
// optional trend indicator and bolder KPI number typography.
export function StatsCard({
  label,
  value,
  subtitle,
  icon,
  isLoading,
  tone = "primary",
  trend,
}: StatsCardProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    // Phase UI-Premium-1: `interactive` gives every KPI tile the same
    // subtle border/shadow lift @travio/ui already ships for clickable
    // cards - a KPI tile isn't a link, but the same ambient "this
    // surface is alive" hover reads as premium polish rather than a
    // false click affordance (no cursor/color change implies
    // navigation, just a soft lift), and it costs nothing new: Card
    // already defines the hover classes, this just opts a tile in.
    <Card interactive>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        {/* min-w-0 is required alongside truncate here - a flex item's
            default min-width is its content's natural (unwrapped) size,
            which blocks shrinking below that width and pushes the icon
            chip out of the card. min-w-0 lifts that floor so the label
            can actually shrink/ellipsize instead of overflowing.

            Phase UI-Premium-1: recast as a small-caps caption (was
            text-sm font-medium) so the label visually recedes and the
            value below reads as the clear focal point - the same
            label/value contrast premium KPI tiles (Stripe, Linear,
            Vercel) use instead of two same-weight lines. */}
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? (
          // Phase UI-Premium-1: rounded-lg (was rounded-md) - matches
          // the card's own corner radius instead of a tighter one, so
          // the chip reads as part of one cohesive shape.
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              TONE_CLASSES[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {/* text-heading-lg's size (not heading-xl) kept deliberately -
            growing the KPI number further risks overflow/wrapping in
            the tighter grids (Analytics' 6-card row, Finance's 5-card
            row) some existing pages already use. font-bold alone gives
            the "stronger KPI hierarchy" this phase asks for without
            that risk. tracking-tight (Phase UI-Premium-1) tightens the
            number's letterspacing slightly for a denser, more
            numeric-display feel at this weight/size - typographic
            polish only, doesn't change layout.

            break-words matters more than it looks: Intl.NumberFormat
            (formatCurrency) inserts a non-breaking space between the
            currency code and the amount (e.g. "SAR 0.00"), and a
            couple of callers (BookingSummaryCards' customerId fallback)
            can pass a long single-token UUID - both are "unbreakable"
            strings that overflow a narrow KPI card unless the browser
            is allowed to break mid-token as a last resort. */}
        <p className="text-heading-lg break-words font-bold tracking-tight text-foreground">
          {value}
        </p>
        {subtitle || trend ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend.direction === "up" ? "text-success" : "text-danger",
                )}
              >
                {trend.direction === "up" ? (
                  <ArrowUp size={12} aria-hidden="true" />
                ) : (
                  <ArrowDown size={12} aria-hidden="true" />
                )}
                {trend.value}
              </span>
            ) : null}
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
