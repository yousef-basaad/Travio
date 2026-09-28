"use client";

import Link from "next/link";
import { Plus, CalendarCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@travio/ui";

// Design System v2.5 (Product-8.2 Phase 2): the reference's circular "+"
// quick-add button. Only lists destinations that are real, dedicated
// creation routes today - "New Booking" (/bookings/new). Lead/customer
// creation exist too, but only as an in-page dialog trigger on their
// own list pages (no deep-linkable "open the create dialog" route), so
// listing them here would be a label that doesn't actually do what it
// says - left out rather than faked. Extend this list as real
// dedicated creation routes are added.
export function QuickAddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Quick add"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-fast ease-default hover:bg-primary-hover"
        >
          <Plus size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Create new</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/bookings/new">
            <CalendarCheck size={15} />
            New Booking
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
