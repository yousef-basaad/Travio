import type { ReactNode } from "react";
import { cn } from "@travio/utils";
import { Button } from "../button";

export interface AppNavItem {
  label: string;
  href: string;
  /**
   * Design System v2.0: optional leading icon (e.g. a lucide-react
   * component, sized by the caller - AppSidebar doesn't force a size so
   * it stays icon-library-agnostic). Every nav item renders in the same
   * icon-slot + label row shape whether or not an icon is passed, which
   * is what makes the icon-only rail mode (Design System v2.5) a pure
   * responsive-CSS toggle instead of a second markup path.
   */
  icon?: ReactNode;
}

// Pure, framework-agnostic prefix match - a section's own index route
// (e.g. "/bookings") should also read as active on its nested routes
// ("/bookings/[id]", "/bookings/new"). The single shared implementation
// of this algorithm - apps compute `pathname` themselves (usePathname()
// is a Next.js hook, which this package deliberately never imports) and
// call this to build their own isActive check.
export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface AppSidebarProps {
  /** Brand/logo lockup - rendered as-is, so app-specific branding never lives here. */
  brand: ReactNode;
  /** Design System v2.5: flat list (the reference has no grouped/labeled sections). */
  items: readonly AppNavItem[];
  pathname: string;
  /**
   * Renders the actual link element for a nav item (e.g. a next/link
   * <Link>) - this package has no router dependency, so the caller
   * supplies the real interactive element, same as Button's own
   * `asChild` convention. The label span inside it should carry
   * `data-sidebar-label` (an inline element) so it collapses correctly
   * in the icon-rail state - see the component comment below.
   */
  renderLink: (item: AppNavItem, active: boolean) => ReactNode;
  /**
   * Design System v2.5: the bottom-pinned user card (avatar + name +
   * role + dropdown indicator) - app-specific (session data), so it's a
   * slot, not something this package fetches or renders itself. Wrap
   * any block-level collapsible region inside it with
   * `data-sidebar-block` (see comment below).
   */
  footer?: ReactNode;
  className?: string;
}

// Generic dashboard sidebar shell - no business nav data, no routing
// library, no auth.
//
// Design System v2.5 (Product-8.2 Phase 2): rebuilt for the reference's
// three-tier responsive rail:
//   - below `md` (mobile): hidden entirely - MobileNavDrawer is the
//     alternative there.
//   - `md` to `lg` (tablet): visible as a 72px icon-only rail - every
//     `data-sidebar-label`/`data-sidebar-block` descendant (nav item
//     labels, the brand wordmark, the user card's name/role/chevron) is
//     hidden via the arbitrary-variant rule below, without renderLink/
//     brand/footer needing to know they're being collapsed - they
//     always render their full markup, this component just hides the
//     text portions by attribute at this breakpoint.
//   - `lg` and up (desktop): full 240px rail, everything visible.
// This attribute-based approach (rather than a `collapsed` boolean
// threaded through renderLink) is what lets the exact same brand/
// renderLink/footer render props work unchanged in MobileNavDrawer too,
// which never collapses (it's a separate component, only ever shown
// below `md`, where these breakpoint-scoped rules don't apply).
export function AppSidebar({ brand, items, pathname, renderLink, footer, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[72px] lg:w-60",
        "[&_[data-sidebar-label]]:hidden [&_[data-sidebar-block]]:hidden",
        "lg:[&_[data-sidebar-label]]:inline lg:[&_[data-sidebar-block]]:block",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2 overflow-hidden border-b border-sidebar-border px-5">
        {brand}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard sections">
        {items.map((item) => {
          const active = isRouteActive(pathname, item.href);
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "h-10 w-full justify-start gap-2.5 overflow-hidden rounded-md px-3 text-sm font-normal text-sidebar-foreground/70 transition-colors duration-fast ease-default hover:bg-sidebar-hover hover:text-sidebar-foreground",
                active &&
                  "bg-sidebar-active font-medium text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
              )}
            >
              {renderLink(item, active)}
            </Button>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-sidebar-border p-3">{footer}</div> : null}
    </aside>
  );
}
