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
  BarChart3,
  UserPlus,
  UsersRound,
  CreditCard,
  Palette,
  FileText,
  CalendarDays,
  Inbox,
  Activity,
  Sparkles,
  Settings as SettingsIcon,
  HelpCircle,
} from "lucide-react";
import { AppSidebar, isRouteActive, type AppNavItem } from "@travio/ui";
import { useSession } from "@travio/auth";
import { useT } from "@/lib/i18n/i18n-provider";
import { useBrandLockup } from "@/lib/branding/brand-context";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
  AGENCY_OWNER_ROLES,
  ANALYTICS_ROLES,
  BOOKINGS_ROLES,
  CUSTOMERS_ROLES,
  DASHBOARD_ROLES,
  DOCUMENTS_ROLES,
  FINANCE_ROLES,
  LEADS_ROLES,
  VISA_ROLES,
} from "@/lib/auth/domain-roles";
import { itemsForRole, type RoleScopedItem } from "@/lib/navigation/nav-access";
import { UserMenu } from "./user-menu";

// Design System v2.5 (Product-8.2 Phase 2): the reference's sidebar is a
// single flat list (no grouped/labeled sections, unlike the previous
// Overview/CRM/Operations/Finance/Reports/Settings grouping) - this is
// the exact 13-item list the phase brief specifies, in that order.
// Routes point at the real existing page wherever one exists; the five
// that don't (Calendar, Inbox, Activities, AI Assistant, Help Center)
// point at a real route rendering an honest "not available yet"
// placeholder (ComingSoon, see app/(dashboard)/calendar/page.tsx etc.) -
// never a dead link and never a faked feature. CRM points at
// /customers (the reference's own "CRM & Customer Management" screen
// shows the customer list/detail as its main content) rather than
// /leads - Leads stays reachable from within the Customers page's own
// existing navigation, this phase doesn't restructure that.
const ICON_SIZE = 18;

export type DashboardNavItem = AppNavItem & RoleScopedItem;

// A nav entry as defined here: a message key instead of display text,
// translated into the signed-in user's language by useNavItems().
export type NavDefinition = Omit<AppNavItem, "label"> & RoleScopedItem & { labelKey: MessageKey };

// Each item lists the roles that may use it - the same lists the API
// guards enforce (lib/auth/domain-roles.ts) - so nobody is offered a page
// whose data would answer 403. Placeholder pages ("Coming soon") are open
// to every dashboard role.
export const NAV_ITEMS: readonly NavDefinition[] = [
  { labelKey: "nav.operationsCenter", href: "/", icon: <LayoutDashboard size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
  { labelKey: "nav.crm", href: "/customers", icon: <Users size={ICON_SIZE} />, roles: CUSTOMERS_ROLES },
  { labelKey: "nav.leads", href: "/leads", icon: <UserPlus size={ICON_SIZE} />, roles: LEADS_ROLES },
  { labelKey: "nav.bookings", href: "/bookings", icon: <CalendarCheck size={ICON_SIZE} />, roles: BOOKINGS_ROLES },
  { labelKey: "nav.visa", href: "/visa", icon: <Stamp size={ICON_SIZE} />, roles: VISA_ROLES },
  { labelKey: "nav.finance", href: "/finance", icon: <Receipt size={ICON_SIZE} />, roles: FINANCE_ROLES },
  { labelKey: "nav.analytics", href: "/analytics", icon: <BarChart3 size={ICON_SIZE} />, roles: ANALYTICS_ROLES },
  { labelKey: "nav.documents", href: "/documents", icon: <FileText size={ICON_SIZE} />, roles: DOCUMENTS_ROLES },
  { labelKey: "nav.calendar", href: "/calendar", icon: <CalendarDays size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
  { labelKey: "nav.inbox", href: "/inbox", icon: <Inbox size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
  { labelKey: "nav.activities", href: "/activities", icon: <Activity size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
  { labelKey: "nav.aiAssistant", href: "/ai-assistant", icon: <Sparkles size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
  { labelKey: "nav.team", href: "/team", icon: <UsersRound size={ICON_SIZE} />, roles: AGENCY_OWNER_ROLES },
  { labelKey: "nav.subscription", href: "/subscription", icon: <CreditCard size={ICON_SIZE} />, roles: AGENCY_OWNER_ROLES },
  { labelKey: "nav.branding", href: "/branding", icon: <Palette size={ICON_SIZE} />, roles: AGENCY_OWNER_ROLES },
  { labelKey: "nav.settings", href: "/settings", icon: <SettingsIcon size={ICON_SIZE} />, roles: AGENCY_OWNER_ROLES },
  { labelKey: "nav.helpCenter", href: "/help-center", icon: <HelpCircle size={ICON_SIZE} />, roles: DASHBOARD_ROLES },
];

// The items the signed-in user may use. Shared by the desktop sidebar and
// the mobile drawer so both always show the same list.
export function useNavItems(): DashboardNavItem[] {
  const { profile } = useSession();
  const t = useT();
  return itemsForRole(NAV_ITEMS, profile?.role).map(({ labelKey, ...item }) => ({ ...item, label: t(labelKey) }));
}

// Exported so DashboardHeader can show the current section's title
// without a second, duplicated route->label array - NAV_ITEMS above
// stays the single source of truth. Returns a message key (the header
// translates it). Falls back to "Dashboard" for
// routes with no nav entry (e.g. "/login", "/forbidden", which never
// render inside this layout anyway, or a customer/lead/booking detail
// page nested under a listed route). Uses the same isRouteActive
// @travio/ui export AppSidebar itself uses - one matching algorithm,
// not two.
export function getNavTitle(pathname: string): MessageKey {
  for (const item of NAV_ITEMS) {
    if (isRouteActive(pathname, item.href)) {
      return item.labelKey;
    }
  }
  return "nav.dashboard";
}

// Brand lockup (mark + wordmark). Travio-specific copy, so it's built
// here and passed into AppSidebar/MobileNavDrawer as a prop rather than
// hardcoded in @travio/ui. The wordmark carries `data-sidebar-block` so
// AppSidebar's icon-rail state (Design System v2.5) hides it
// automatically - only the mark stays visible in rail mode, matching
// the reference's own collapsed treatment.
export function Brand() {
  const t = useT();
  const { logoUrl, agencyName } = useBrandLockup();

  // An agency with its own logo shows that and its name instead of Travio's.
  if (logoUrl) {
    return (
      <>
        <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" />
        <div data-sidebar-block className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{agencyName ?? "Travio"}</p>
        </div>
      </>
    );
  }

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
        <p className="truncate text-xs text-sidebar-foreground/60">{t("brand.tagline")}</p>
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
  const items = useNavItems();

  return (
    <AppSidebar
      brand={<Brand />}
      items={items}
      pathname={pathname}
      renderLink={renderNavLink}
      footer={<UserMenu variant="sidebar" />}
    />
  );
}
