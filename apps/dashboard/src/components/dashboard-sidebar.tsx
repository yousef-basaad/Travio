"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@travio/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stamp,
  Receipt,
  FileBarChart,
  FileText,
  CalendarDays,
  Inbox,
  Activity,
  Sparkles,
  Settings as SettingsIcon,
  HelpCircle,
} from "lucide-react";
import { AppSidebar, isRouteActive, type AppNavItem } from "@travio/ui";
import { UserMenu } from "./user-menu";

// Design System v2.5 (Product-8.2 Phase 2): the reference's sidebar is a
// single flat list (no grouped/labeled sections, unlike the previous
// Overview/CRM/Operations/Finance/Reports/Settings grouping) - this is
// the exact 13-item list the phase brief specifies, in that order.
// Routes point at the real existing page wherever one exists; the six
// that don't (Documents, Calendar, Inbox, Activities, AI Assistant,
// Help Center) point at a real route rendering an honest "not available
// yet" placeholder (ComingSoon, see app/(dashboard)/documents/page.tsx
// etc.) - never a dead link and never a faked feature. CRM points at
// /customers (the reference's own "CRM & Customer Management" screen
// shows the customer list/detail as its main content) rather than
// /leads - Leads stays reachable from within the Customers page's own
// existing navigation, this phase doesn't restructure that.
const ICON_SIZE = 18;

export const NAV_ITEMS: readonly AppNavItem[] = [
  { label: "Operations Center", href: "/", icon: <LayoutDashboard size={ICON_SIZE} /> },
  { label: "CRM", href: "/customers", icon: <Users size={ICON_SIZE} /> },
  { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={ICON_SIZE} /> },
  { label: "Visa Center", href: "/visa", icon: <Stamp size={ICON_SIZE} /> },
  { label: "Finance", href: "/finance", icon: <Receipt size={ICON_SIZE} /> },
  { label: "Reports", href: "/reports", icon: <FileBarChart size={ICON_SIZE} /> },
  { label: "Documents", href: "/documents", icon: <FileText size={ICON_SIZE} /> },
  { label: "Calendar", href: "/calendar", icon: <CalendarDays size={ICON_SIZE} /> },
  { label: "Inbox", href: "/inbox", icon: <Inbox size={ICON_SIZE} /> },
  { label: "Activities", href: "/activities", icon: <Activity size={ICON_SIZE} /> },
  { label: "AI Assistant", href: "/ai-assistant", icon: <Sparkles size={ICON_SIZE} /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon size={ICON_SIZE} /> },
  { label: "Help Center", href: "/help-center", icon: <HelpCircle size={ICON_SIZE} /> },
] as const;

// Exported so DashboardHeader can show the current section's title
// without a second, duplicated route->label array - NAV_ITEMS above
// stays the single source of truth. Falls back to "Dashboard" for
// routes with no nav entry (e.g. "/login", "/forbidden", which never
// render inside this layout anyway, or a customer/lead/booking detail
// page nested under a listed route). Uses the same isRouteActive
// @travio/ui export AppSidebar itself uses - one matching algorithm,
// not two.
export function getNavTitle(pathname: string): string {
  for (const item of NAV_ITEMS) {
    if (isRouteActive(pathname, item.href)) {
      return item.label;
    }
  }
  return "Dashboard";
}

// Brand lockup (mark + wordmark). Travio-specific copy, so it's built
// here and passed into AppSidebar/MobileNavDrawer as a prop rather than
// hardcoded in @travio/ui. The wordmark carries `data-sidebar-block` so
// AppSidebar's icon-rail state (Design System v2.5) hides it
// automatically - only the mark stays visible in rail mode, matching
// the reference's own collapsed treatment.
export function Brand() {
  return (
    <>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
      >
        T
      </span>
      <div data-sidebar-block className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">Travio</p>
        <p className="truncate text-xs text-sidebar-foreground/60">Agency Platform</p>
      </div>
    </>
  );
}

// Exported so both AppSidebar (desktop) and MobileNavDrawer (mobile)
// render navigation links exactly the same way - one renderLink
// implementation, not two. item.href is a plain `string` at this
// boundary - AppNavItem (packages/ui) has no router dependency, so it
// can't carry typedRoutes' literal Route union; NAV_ITEMS above is
// still `as const` and every href in it is a real route, so this cast
// is safe, not a loophole. The label span carries `data-sidebar-label`
// so AppSidebar's icon-rail state can hide it (see that component's own
// comment) - MobileNavDrawer never applies that rule, so the same
// output still shows full labels there.
export function renderNavLink(item: AppNavItem, active: boolean) {
  return (
    <Link
      href={item.href as Route}
      aria-current={active ? "page" : undefined}
      className="flex w-full items-center gap-2.5"
    >
      <span aria-hidden="true" className={cn("shrink-0", active ? "opacity-100" : "opacity-80")}>
        {item.icon}
      </span>
      <span data-sidebar-label className="truncate">
        {item.label}
      </span>
    </Link>
  );
}

// Thin app-specific wrapper around @travio/ui's AppSidebar - owns the
// nav data and the next/link rendering (AppSidebar has no router
// dependency), delegates layout/active-state/styling to the shared
// component.
export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <AppSidebar
      brand={<Brand />}
      items={NAV_ITEMS}
      pathname={pathname}
      renderLink={renderNavLink}
      footer={<UserMenu variant="sidebar" />}
    />
  );
}
