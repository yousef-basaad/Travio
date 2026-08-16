"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@travio/utils";
import { isRouteActive, type AppNavItem } from "./app-sidebar";

export interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: React.ReactNode;
  items: readonly AppNavItem[];
  pathname: string;
  renderLink: (item: AppNavItem, active: boolean) => React.ReactNode;
  /** Same bottom user card AppSidebar renders - see its own comment. */
  footer?: React.ReactNode;
}

// Design System v2.4 (Product-8.1): the audit's single Critical finding
// was that AppSidebar is `hidden ... lg:flex` with no mobile
// alternative anywhere - below 1024px there was no way to navigate the
// dashboard at all. This is that alternative: the exact same nav data/
// renderLink contract AppSidebar takes (no duplicated nav structure),
// rendered as a slide-in overlay instead of a fixed rail.
//
// Design System v2.5 (Product-8.2 Phase 2): flat `items` (was grouped),
// matching AppSidebar's own rebuild, and only relevant below `md` now -
// `md`-to-`lg` (tablet) has AppSidebar's own icon rail, so this drawer's
// job shrinks to true mobile only. Never collapses to icon-only itself
// (always shows full labels) - it's a full-height overlay, not a fixed
// rail competing for canvas width, so there's no reason to hide labels
// here even though the underlying renderLink/footer content is shared
// with AppSidebar's collapsible version.
//
// A plain fixed-position overlay (not the native <dialog>-based Dialog
// primitive) - Dialog centers a boxed modal, this needs to be pinned to
// the left edge and full-height, a different enough shape that reusing
// Dialog would mean fighting its centering instead of building on it.
// Escape-to-close and body-scroll-lock are handled here directly since
// neither a native <dialog> nor a third dependency is warranted for
// that alone.
export function MobileNavDrawer({
  open,
  onOpenChange,
  brand,
  items,
  pathname,
  renderLink,
  footer,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <div
      className={cn("fixed inset-0 z-50 md:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-base ease-default",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-base ease-default",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <div className="flex min-w-0 items-center gap-2">{brand}</div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close navigation"
            className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/70 transition-colors duration-fast hover:bg-sidebar-hover hover:text-sidebar-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard sections">
          {items.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <div
                key={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm font-normal text-sidebar-foreground/70 transition-colors duration-fast ease-default hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  active &&
                    "bg-sidebar-active font-medium text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
                )}
              >
                {renderLink(item, active)}
              </div>
            );
          })}
        </nav>
        {footer ? <div className="border-t border-sidebar-border p-3">{footer}</div> : null}
      </aside>
    </div>
  );
}
