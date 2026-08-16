"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@travio/utils";

export interface CalendarProps {
  /** Controlled selected date - omit for a display-only/no-selection calendar. */
  selected?: Date;
  onSelect?: (date: Date) => void;
  /** Month currently shown - defaults to `selected` or today, uncontrolled after that (the widget owns its own month-navigation state). */
  defaultMonth?: Date;
  className?: string;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Design System v2.5 (Product-8.2 Phase 2): the reference's "Calendar
// (small)" component - a plain dependency-free month grid (no date-
// picker library added, same "hand-roll it, no new dependency for one
// widget" call as TrendChart/BarList already made). Pure display +
// selection; a caller decides what selecting a date actually does (or
// nothing - the header's date button uses this with no onSelect wired
// yet, since there's no date-filtered data source behind it this phase).
export function Calendar({ selected, onSelect, defaultMonth, className }: CalendarProps) {
  const [viewDate, setViewDate] = useState(() => defaultMonth ?? selected ?? new Date());
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  function goToMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div className={cn("w-64 select-none", className)}>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm font-medium text-foreground">
          {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="text-caption font-medium text-muted-foreground">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />;

          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selected ? isSameDay(cellDate, selected) : false;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect?.(cellDate)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors duration-fast ease-default hover:bg-accent hover:text-accent-foreground",
                isToday && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
