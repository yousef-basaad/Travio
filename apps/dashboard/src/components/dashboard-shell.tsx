"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PageContainer, MobileNavDrawer } from "@travio/ui";
import { DashboardHeader } from "./dashboard-header";
import { DashboardFooter } from "./dashboard-footer";
import { DashboardSidebar, Brand, NAV_ITEMS, renderNavLink } from "./dashboard-sidebar";
import { UserMenu } from "./user-menu";

// Design System v2.4 (Product-8.1): owns the one piece of state the
// mobile nav needs (open/closed) and threads it between DashboardHeader
// (the trigger, via AppHeader's `leading` slot) and MobileNavDrawer (the
// panel) - neither of those needs to know about the other directly.
// DashboardSidebar (the desktop rail, now with its own md-lg icon-rail
// state - Design System v2.5) is unchanged in ownership and still
// renders unconditionally; MobileNavDrawer is the `md:hidden`
// alternative for true mobile only, now that the tablet range has a
// real rail instead of needing the drawer.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        brand={<Brand />}
        items={NAV_ITEMS}
        pathname={pathname}
        renderLink={renderNavLink}
        footer={<UserMenu variant="sidebar" />}
      />
      <div className="flex flex-1 flex-col">
        <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />
        <PageContainer>{children}</PageContainer>
        <DashboardFooter />
      </div>
    </div>
  );
}
