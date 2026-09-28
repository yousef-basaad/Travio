import { useId, type ReactNode } from "react";
import { cn } from "@travio/utils";
import { Card } from "../card";
import { Skeleton } from "../skeleton";
import { StatBadge } from "../stat-badge";

export type KpiCardTone = "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<KpiCardTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

const TONE_STROKE: Record<KpiCardTone, string> = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
  info: "hsl(var(--info))",
};

const SPARK_WIDTH = 200;
const SPARK_HEIGHT = 40;

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): full-bleed
// gradient area sparkline - bigger viewbox than the v2.6 sparkline
// (200x40, was 100x28) since it now spans the card's full width
// (rendered inside a `-mx-5` wrapper in KpiCard, edge to edge, matching
// the reference's own KPI cards where the trend chart runs under the
// number with no side margin). Still dependency-free, still no axis/
// tooltip/legend - a decorative trend, not a readable chart. Renders
// nothing when fewer than 2 points exist.
function Sparkline({ values, tone }: { values: number[]; tone: KpiCardTone }) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * SPARK_WIDTH;
    const y = SPARK_HEIGHT - ((value - min) / range) * SPARK_HEIGHT;
    return [x, y] as const;
  });
  const linePoints = points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `0,${SPARK_HEIGHT} ${linePoints} ${SPARK_WIDTH},${SPARK_HEIGHT}`;

  return (
    <svg
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      role="img"
      aria-label="Trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TONE_STROKE[tone]} stopOpacity={0.22} />
          <stop offset="100%" stopColor={TONE_STROKE[tone]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={linePoints}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-5 shadow-sm" role="status" aria-label="Loading">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-3.5 w-24" />
      <Skeleton className="mt-3 h-4 w-28" />
      <Skeleton className="-mx-5 mt-3 h-9 w-[calc(100%+2.5rem)]" />
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: KpiCardTone;
  isLoading?: boolean;
  trend?: { value: string; direction: "up" | "down" };
  /** Real trailing-period context for the trend badge, e.g. "vs last month" - never invented. */
  trendContext?: string;
  /** Optional trailing-period values for the decorative sparkline - omit entirely when no real series exists, never a fabricated flat line. */
  sparkline?: number[];
  /** Optional slot below the sparkline (e.g. a "View all" link, a secondary stat). */
  footer?: ReactNode;
}

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): rebuilt the
// internal layout order to match the actual TRAVIO reference (icon alone
// at the top, then the big value, then the label *below* the value, then
// the trend line, then a full-bleed sparkline) - the previous v2.6 pass
// (icon+label sharing the top row, label above the value) was a
// plausible "premium card" guess made without this reference in hand.
// Label reads as plain sentence-case muted text now (was uppercase
// tracking-wide eyebrow text) to match the reference's own label
// weight. Trend row gained a real trailing context string (trendContext,
// e.g. "vs last month") next to the StatBadge chip, same text the
// reference always pairs with its trend arrows - callers must pass real,
// pre-formatted text, never a computed guess. Sparkline now bleeds to
// the card's full width via a `-mx-5` wrapper. Fixed-height reserved
// slots (label/trend/sparkline) still apply so every card in a row stays
// the same height regardless of which optional props a given card has.
export function KpiCard({
  label,
  value,
  icon,
  tone = "primary",
  isLoading,
  trend,
  trendContext,
  sparkline,
  footer,
}: KpiCardProps) {
  if (isLoading) {
    return <KpiCardSkeleton />;
  }

  return (
    <Card
      interactive
      className="border-border/40 p-5 shadow-sm transition-all duration-base ease-default hover:-translate-y-0.5 hover:border-border/60 hover:shadow-lg"
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}
        >
          {icon}
        </span>
      ) : null}

      <p className="mt-4 text-heading-xl font-bold leading-none tracking-tight text-foreground">{value}</p>

      <p className="mt-2 truncate text-sm text-muted-foreground">{label}</p>

      <div className="mt-3 flex h-4 items-center gap-1.5">
        {trend ? (
          <>
            <StatBadge value={trend.value} direction={trend.direction} />
            {trendContext ? <span className="truncate text-xs text-muted-foreground">{trendContext}</span> : null}
          </>
        ) : null}
      </div>

      <div className="-mx-5 mt-3 h-9">
        {sparkline && sparkline.length > 1 ? <Sparkline values={sparkline} tone={tone} /> : null}
      </div>

      {footer}
    </Card>
  );
}
