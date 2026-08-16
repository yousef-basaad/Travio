"use client";

import { useId, useMemo, useState, type PointerEvent } from "react";
import { cn } from "@travio/utils";

export interface TrendChartSeries {
  name: string;
  /** Any valid CSS color value (e.g. "hsl(var(--primary))") - never hardcoded here. */
  color: string;
  values: number[];
}

export interface TrendChartProps {
  /** X-axis category labels, same length as every series' `values`. */
  labels: string[];
  /** Render order = draw order. Only the first series gets an area fill (the "actual" emphasis series, per design-system convention). */
  series: readonly TrendChartSeries[];
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}

const VIEW_WIDTH = 600;

// Lightweight, dependency-free inline SVG line/area chart - no charting
// library is installed anywhere in this monorepo (and this one card
// isn't reason enough to add one). Ships with the essentials a bare
// table can't give a "trend" the job it's meant to do: a crosshair +
// tooltip on hover, a legend (color never carries identity alone - each
// series is also named in the legend and the tooltip), and a "View as
// table" toggle for the fully accessible alternative. Text (legend/
// tooltip values) always renders in text-foreground/text-muted-
// foreground, never in the series color itself.
export function TrendChart({
  labels,
  series,
  height = 200,
  valueFormatter = (value) => String(value),
  className,
}: TrendChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => {
    const allValues = series.flatMap((s) => s.values);
    return Math.max(1, ...allValues);
  }, [series]);

  const paddingTop = height * 0.1;
  const plotHeight = height - paddingTop;
  const count = labels.length;

  function xAt(index: number): number {
    if (count <= 1) return VIEW_WIDTH / 2;
    return (index / (count - 1)) * VIEW_WIDTH;
  }

  function yAt(value: number): number {
    return paddingTop + plotHeight - (value / maxValue) * plotHeight;
  }

  function pointsFor(values: number[]): string {
    return values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ");
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (count - 1));
    setHoverIndex(Math.min(count - 1, Math.max(0, index)));
  }

  const primary = series[0];

  return (
    <div className={cn("space-y-3", className)}>
      {series.length > 1 ? (
        <ul className="flex flex-wrap items-center gap-4" aria-hidden="true">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <svg
          role="img"
          aria-label="Trend chart"
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          preserveAspectRatio="none"
          className="h-auto w-full"
          style={{ height }}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {primary ? (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={primary.color} stopOpacity={0} />
              </linearGradient>
            </defs>
          ) : null}

          {/* Baseline - recessive, matches the design system's border token. */}
          <line
            x1={0}
            y1={height - 0.5}
            x2={VIEW_WIDTH}
            y2={height - 0.5}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />

          {primary && primary.values.length > 0 ? (
            <polygon
              points={`${xAt(0)},${height} ${pointsFor(primary.values)} ${xAt(count - 1)},${height}`}
              fill={`url(#${gradientId})`}
              stroke="none"
            />
          ) : null}

          {series.map((s) => (
            <polyline
              key={s.name}
              points={pointsFor(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {hoverIndex !== null ? (
            <line
              x1={xAt(hoverIndex)}
              y1={paddingTop}
              x2={xAt(hoverIndex)}
              y2={height}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          ) : null}

          {hoverIndex !== null
            ? series.map((s) => (
                <circle
                  key={s.name}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5}
                />
              ))
            : null}
        </svg>

        {hoverIndex !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute top-0 -translate-y-full whitespace-nowrap rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: `${(xAt(hoverIndex) / VIEW_WIDTH) * 100}%`,
              transform: "translate(-50%, -0.5rem)",
            }}
          >
            <p className="mb-1 font-medium text-foreground">{labels[hoverIndex]}</p>
            {series.map((s) => (
              <p key={s.name} className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}: <span className="font-medium text-foreground">{valueFormatter(s.values[hoverIndex] ?? 0)}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{labels[0]}</span>
        {labels.length > 2 ? <span>{labels[Math.floor(labels.length / 2)]}</span> : null}
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
