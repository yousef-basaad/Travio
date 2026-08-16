"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@travio/ui";
import { NotificationCenter } from "@/features/notifications";
import { HeaderGreeting } from "@/features/dashboard-home";
import { getNavTitle } from "./dashboard-sidebar";
import { UserMenu } from "./user-menu";
import { GlobalSearch } from "./global-search";
import { QuickAddMenu } from "./quick-add-menu";
import { DatePickerButton } from "./date-picker-button";

// Thin app-specific wrapper around @travio/ui's AppHeader - owns the
// route-title lookup (reusing DashboardSidebar's own getNavTitle - no
// second route->label array) and every auth/session-coupled piece
// (UserMenu, NotificationCenter), none of which belongs in @travio/ui.
//
// Design System v2.7 (Product-8.2 Reference Fidelity Pass): on the
// Operations Center route only ("/"), the reference replaces the plain
// breadcrumb with the personalized greeting (see HeaderGreeting) - every
// other route keeps the unchanged "Travio / <section>" breadcrumb this
// header has always shown. This is a pure per-route render swap inside
// this one shared component; no other route's markup changes.
export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const title = getNavTitle(pathname);
  const isHome = pathname === "/";

  return (
    <AppHeader
      breadcrumb={isHome ? undefined : ["Travio", title]}
      title={isHome ? <HeaderGreeting /> : undefined}
      leading={
        onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors duration-fast hover:bg-accent md:hidden"
          >
            <Menu size={20} />
          </button>
        ) : null
      }
      center={<GlobalSearch />}
      actions={
        <div className="flex items-center gap-2">
          <QuickAddMenu />
          <DatePickerButton />
          <NotificationCenter />
          <UserMenu variant="header" />
        </div>
      }
    />
  );
}
