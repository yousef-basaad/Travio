"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader, Button } from "@travio/ui";
import { cn } from "@travio/utils";
import { signOut, useSession } from "@travio/auth";

const NAV_ITEMS = [
  { label: "My Bookings", href: "/bookings" },
  { label: "Documents", href: "/documents" },
  { label: "Finance", href: "/finance" },
  { label: "My Profile", href: "/profile" },
] as const;

function PortalNavLinks({ pathname, className }: { pathname: string; className?: string }) {
  return (
    <nav aria-label="Portal sections" className={cn("flex items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            size="sm"
            className={cn("shrink-0", active && "bg-accent text-accent-foreground")}
          >
            <Link href={item.href} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

// Thin app-specific wrapper around @travio/ui's AppHeader, same
// division of responsibility as the dashboard's own DashboardHeader -
// this owns the portal's nav data/session-aware sign-out, AppHeader
// stays app-agnostic. AppHeader's own `center` slot is desktop-only
// (`hidden ... md:flex`, by design - it's meant for the dashboard's
// future command palette trigger too), so on narrow screens the 4-item
// nav below renders as a second, horizontally-scrollable row instead of
// disappearing entirely.
export function PortalHeader() {
  const pathname = usePathname();
  const { profile } = useSession();

  // Mirrors DashboardHeader's UserMenu.handleLogout exactly - the
  // already-existing signOut() server action (@travio/auth), followed
  // by a hard redirect (a bare <form action={signOut}> wouldn't
  // navigate anywhere on its own).
  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <Fragment>
      <AppHeader
        title={<span className="text-heading-sm text-foreground">Travio</span>}
        center={<PortalNavLinks pathname={pathname} />}
        actions={
          <div className="flex items-center gap-2">
            {profile?.fullName ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {profile.fullName}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        }
      />
      <PortalNavLinks
        pathname={pathname}
        className="overflow-x-auto border-b border-border px-4 py-2 md:hidden"
      />
    </Fragment>
  );
}
