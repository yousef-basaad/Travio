"use client";

import { useState } from "react";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Button, Popover, PopoverTrigger, PopoverContent, Calendar } from "@travio/ui";
import { formatDate } from "@travio/utils";

// Design System v2.5 (Product-8.2 Phase 2): the reference's header
// date button. Shows today's real date (Date.now(), no invented
// value) and opens the new small Calendar widget - selection is local
// UI state only, not wired to any date-range filter, since no page's
// data is filtered by a global date range today (each page fetches its
// own full list). A real, honest placeholder ready for a future phase
// to wire to an actual filter, not a decorative fake control.
export function DatePickerButton() {
  const [selected, setSelected] = useState<Date>(() => new Date());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
          <CalendarIcon size={14} />
          <span className="hidden sm:inline">{formatDate(selected.toISOString())}</span>
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <Calendar selected={selected} onSelect={setSelected} />
      </PopoverContent>
    </Popover>
  );
}
