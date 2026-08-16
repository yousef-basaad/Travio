import { cn } from "@travio/utils";

export interface DonutChartSegment {
  label: string;
  value: number;
  /** Any valid CSS color value (e.g. "hsl(var(--primary))") - never hardcoded here. */
  color: string;
}

export interface DonutChartProps {
  segments: DonutChartSegment[];
  /** Rendered in the donut's center - typically the total. */
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  className?: string;
}

const STROKE_WIDTH = 14;

// Design System v2.5 (Product-8.2 Phase 3): dependency-free SVG donut
// (stacked stroke-dasharray arcs on a circle) - same "hand-roll it, no
// new chart library" call TrendChart/BarList already made. A legend
// with real percentages always accompanies the ring (color is never the
// sole carrier of identity), and every segment's value/percentage is
// real text, never baked only into the arc's geometry.
export function DonutChart({ segments, centerLabel, centerValue, size = 160, className }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE_WIDTH}
          />
          {total > 0
            ? segments.map((segment) => {
                const fraction = segment.value / total;
                const dash = fraction * circumference;
                const circle = (
                  <circle
                    key={segment.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                  />
                );
                offset += dash;
                return circle;
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue ? <p className="text-heading-md font-bold text-foreground">{centerValue}</p> : null}
          {centerLabel ? <p className="text-xs text-muted-foreground">{centerLabel}</p> : null}
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {segment.value}
              {total > 0 ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({Math.round((segment.value / total) * 100)}%)
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
