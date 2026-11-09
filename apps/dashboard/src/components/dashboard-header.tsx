"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, Mail, Menu, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@travio/ui";
import { NotificationCenter } from "@/features/notifications";
import { HeaderGreeting } from "@/features/dashboard-home";
import { getNavTitle } from "./dashboard-sidebar";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
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
// Inbox and calendar shortcuts next to the notifications bell, as in the
// design's header. Both pages are open to every dashboard role.
const SHORTCUTS: { href: Route; label: MessageKey; icon: LucideIcon }[] = [
  { href: "/inbox", label: "nav.inbox", icon: Mail },
  { href: "/calendar", label: "nav.calendar", icon: CalendarDays },
];

function HeaderShortcuts() {
  const t = useT();
  return (
    <>
      {SHORTCUTS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={t(label)}
          title={t(label)}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground sm:flex"
        >
          <Icon size={18} aria-hidden="true" />
        </Link>
      ))}
    </>
  );
}

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const title = t(getNavTitle(pathname));
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
            aria-label={t("header.openNavigation")}
            className="-ms-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors duration-fast hover:bg-accent md:hidden"
          >
            <Menu size={20} />
          </button>
        ) : null
      }
      center={<GlobalSearch />}
      actions={
        <div className="flex items-center gap-2">
          <QuickAddMenu />
          <NotificationCenter />
          <HeaderShortcuts />
          <DatePickerButton />
          <UserMenu variant="header" />
        </div>
      }
    />
  );
}
