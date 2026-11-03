"use client";

import Link from "next/link";
import { Plus, CalendarCheck, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// Design System v2.5 (Product-8.2 Phase 2): the reference's circular "+"
// quick-add button. Only lists destinations that really create something:
// "New Booking" (/bookings/new) and "New Customer" (/customers?new=1,
// which opens the Customers page's create dialog). Lead creation exists
// only as an in-page dialog on /leads with no deep link yet, so it's
// left out rather than faked. Extend this list as more creation entry
// points become linkable.
export function QuickAddMenu() {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("quickAdd.label")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-fast ease-default hover:bg-primary-hover"
        >
          <Plus size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t("quickAdd.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/bookings/new">
            <CalendarCheck size={15} />
            {t("quickAdd.newBooking")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/customers?new=1">
            <UserPlus size={15} />
            {t("quickAdd.newCustomer")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
