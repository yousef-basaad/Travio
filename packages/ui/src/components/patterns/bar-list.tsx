import { cn } from "@travio/utils";

export interface BarListRow {
  label: string;
  value: number;
  /** Tailwind background class for the bar fill - falls back to bg-accent. */
  barClassName?: string;
}

export interface BarListProps {
  rows: BarListRow[];
  className?: string;
}

// Design System v2.4 (Product-8.1): extracted from the dashboard's own
// analytics feature (booking-status-card.tsx defined this locally,
// despite it being a generically useful "label + count + proportional
// bar" pattern any feature might need next). Same markup, now shared -
// still no charting library anywhere in this monorepo, and this
// component alone still isn't reason enough to add one. Each bar is
// decorative (aria-hidden); the count/label text is what actually
// carries the data.
export function BarList({ rows, className }: BarListProps) {
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-muted-foreground">{row.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              aria-hidden="true"
              className={cn(
                "h-2 rounded-full transition-all duration-slow ease-default",
                row.barClassName ?? "bg-accent",
              )}
              style={{ width: `${(row.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-medium text-foreground">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}
