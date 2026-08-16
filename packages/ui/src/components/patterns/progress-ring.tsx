import { cn } from "@travio/utils";

export interface ProgressRingProps {
  /** 0-100. Values outside that range are clamped, never left to draw a broken ring. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Any valid CSS color value. */
  color?: string;
  /** Rendered in the ring's center - typically the value formatted as a caller sees fit. */
  label?: string;
  className?: string;
}

// Design System v2.5 (Product-8.2 Phase 3): single-value circular
// progress indicator (the reference's own component library lists this
// alongside the linear progress bar) - dependency-free SVG, same family
// as DonutChart. A caller supplies a real 0-100 value; this never
// invents one.
export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 6,
  color = "hsl(var(--primary))",
  label,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      {label ? (
        <span className="absolute text-xs font-semibold text-foreground">{label}</span>
      ) : null}
    </div>
  );
}
