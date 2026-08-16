import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface AppHeaderProps {
  /**
   * Left side - typically a brand crumb + the current section's title.
   * Kept as a free-form slot (not a structured breadcrumb array) so
   * every existing caller's exact markup keeps working unchanged;
   * `breadcrumb` below is the structured alternative for new callers.
   */
  title?: ReactNode;
  /**
   * Design System v2.0: structured breadcrumb alternative to `title` -
   * an ordered list of labels, the last one rendered as the current
   * page (non-link, bold). Renders instead of `title` when provided.
   */
  breadcrumb?: readonly string[];
  /**
   * Design System v2.0: reserved center slot for a future global search
   * trigger / command palette entry point. Nothing renders here yet -
   * intentionally unimplemented this phase, this just gives the header
   * layout somewhere to put it later without a structural change.
   */
  center?: ReactNode;
  /** Right side - e.g. notifications + a user menu. No session/auth awareness lives here. */
  actions?: ReactNode;
  /**
   * Design System v2.4 (Product-8.1): optional slot rendered before
   * title/breadcrumb - the dashboard's mobile menu trigger lives here
   * (hidden at `lg` and above, where AppSidebar's own rail takes over).
   * Generic (not "menuButton") so any app can use it for its own
   * leading affordance, same "caller supplies the real element"
   * convention as `renderLink` on AppSidebar.
   */
  leading?: ReactNode;
  className?: string;
}

// Generic dashboard header shell - no user/session data, no dropdown
// logic. The caller owns what goes in each slot. Design System v2.2:
// height tuned to 64px (was 56px, matching the reference design
// system's header height and this phase's explicit 64-72px target);
// actions area gets a fixed gap so notification/user-menu spacing stays
// consistent regardless of how many action items a caller renders.
export function AppHeader({ title, breadcrumb, center, actions, leading, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        // Design System v2.4 (Product-8.1): sticky + translucent/blurred
        // background - the reference products' headers stay pinned and
        // let content scroll underneath a frosted-glass bar rather than
        // a flat opaque one. z-30 sits below the mobile nav drawer/
        // dropdown-menu portals (z-50) but above ordinary page content.
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/85 px-6 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <span key={`${crumb}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-muted-foreground">
                      /
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "truncate",
                      isLast
                        ? "text-heading-sm text-foreground"
                        : "text-sm font-medium text-muted-foreground",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb}
                  </span>
                </span>
              );
            })}
          </nav>
        ) : (
          title
        )}
      </div>
      {center ? <div className="hidden flex-1 justify-center md:flex">{center}</div> : null}
      {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </header>
  );
}
