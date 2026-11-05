import { useId, type ReactNode } from "react";
import { cn } from "@travio/utils";
import { Card } from "../card";
import { Skeleton } from "../skeleton";
import { ArrowDown, ArrowUp } from "lucide-react";

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
const SPARK_HEIGHT = 36;

// Gradient area sparkline under the KPI. Dependency-free, no axis/
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
    <div className="rounded-xl border border-border/40 bg-card p-3.5 shadow-sm" role="status" aria-label="Loading">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="mt-3 h-3.5 w-28" />
      <Skeleton className="mt-3 h-9 w-full" />
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: string;
  /** Small text after the value, e.g. a currency ("SAR", "ر.س"). */
  unit?: string;
  icon?: ReactNode;
  tone?: KpiCardTone;
  isLoading?: boolean;
  trend?: { value: string; direction: "up" | "down" };
  /** Real trailing-period context for the trend, e.g. "vs last month" - never invented. */
  trendContext?: string;
  /** Optional trailing-period values for the decorative sparkline - omit entirely when no real series exists, never a fabricated flat line. */
  sparkline?: number[];
  /** Optional slot below the sparkline (e.g. a "View all" link, a secondary stat). */
  footer?: ReactNode;
}

// KPI card from the TRAVIO design (Operations Center): the value at the
// start with a tinted icon tile at the end, the label under them, the trend (arrow +
// percentage in green/red, then its period) under them, and a small
// area sparkline at the bottom. Fixed-height trend/sparkline slots keep
// every card in a row the same height whichever optional props it has.
export function KpiCard({
  label,
  value,
  unit,
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

  const length = value.length + (unit ? unit.length + 1 : 0);

  return (
    <Card
      interactive
      className="rounded-xl border-border/40 p-3.5 shadow-sm transition-all duration-base ease-default hover:-translate-y-0.5 hover:border-border/60 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Long values (money) step down a size instead of overflowing
              a fifth-width card. */}
          <p
            className={cn(
              "font-bold leading-tight tracking-tight text-foreground",
              length > 12 ? "text-heading-sm" : length > 8 ? "text-heading-md" : "text-heading-lg",
            )}
          >
            {value}
            {/* The space lets a narrow card wrap the unit under the value. */}
            {unit ? <> <span className="text-xs font-semibold text-muted-foreground">{unit}</span></> : null}
          </p>
        </div>
        {icon ? (
          <span
            aria-hidden="true"
            className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_CLASSES[tone])}
          >
            {icon}
          </span>
        ) : null}
      </div>

      {/* Full card width, so a two-word label stays on one line in a
          narrow card. */}
      <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>

      <div className="mt-2 flex h-4 items-center gap-1.5 text-xs">
        {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
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
        {trendContext ? <span className="truncate text-muted-foreground">{trendContext}</span> : null}
      </div>

      <div className="mt-2 h-9">
        {sparkline && sparkline.length > 1 ? <Sparkline values={sparkline} tone={tone} /> : null}
      </div>

      {footer}
    </Card>
  );
}
