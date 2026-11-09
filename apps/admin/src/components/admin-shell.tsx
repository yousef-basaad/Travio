"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, Languages, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import { AppSidebar, MobileNavDrawer, PageContainer, isRouteActive, type AppNavItem } from "@travio/ui";
import { cn } from "@travio/utils";
import { signOut, useSession } from "@travio/auth";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { setLocale } from "@/lib/i18n/set-locale";
import type { MessageKey } from "@/lib/i18n/messages/en";

const ICON_SIZE = 18;

// The console's sections. Overview is live; the other four render an
// honest "next stage" placeholder until they're built.
export const ADMIN_NAV: readonly { labelKey: MessageKey; href: string; icon: ReactNode }[] = [
  { labelKey: "nav.overview", href: "/", icon: <LayoutDashboard size={ICON_SIZE} /> },
  { labelKey: "nav.agencies", href: "/tenants", icon: <Building2 size={ICON_SIZE} /> },
  { labelKey: "nav.users", href: "/platform-users", icon: <Users size={ICON_SIZE} /> },
  { labelKey: "nav.billing", href: "/billing", icon: <CreditCard size={ICON_SIZE} /> },
  { labelKey: "nav.settings", href: "/platform-settings", icon: <Settings size={ICON_SIZE} /> },
];

function Brand() {
  const { t } = useI18n();
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

function renderNavLink(item: AppNavItem, active: boolean) {
  return (
    <Link href={item.href as Route} aria-current={active ? "page" : undefined} className="flex w-full items-center gap-2.5">
      <span aria-hidden="true" className={cn("shrink-0", active ? "opacity-100" : "opacity-80")}>
        {item.icon}
      </span>
      <span data-sidebar-label className="truncate">
        {item.label}
      </span>
    </Link>
  );
}

function SidebarUser() {
  const { profile } = useSession();
  const { t } = useI18n();
  if (!profile) return null;
  return (
    <div data-sidebar-block className="min-w-0 px-1 leading-tight">
      <p className="truncate text-sm font-medium text-sidebar-foreground">{profile.fullName}</p>
      <p className="truncate text-xs text-sidebar-foreground/60">{t("header.role")}</p>
    </div>
  );
}

// Sidebar + header for every signed-in admin page: the same AppSidebar /
// MobileNavDrawer the dashboard uses, a language switch and sign-out.
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSwitching, startSwitch] = useTransition();
  const items: AppNavItem[] = ADMIN_NAV.map(({ labelKey, ...item }) => ({ ...item, label: t(labelKey) }));
  const current = ADMIN_NAV.find((item) => (item.href === "/" ? pathname === "/" : isRouteActive(pathname, item.href)));

  const switchLanguage = () =>
    startSwitch(async () => {
      await setLocale(locale === "ar" ? "en" : "ar");
      router.refresh();
    });

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar brand={<Brand />} items={items} pathname={pathname} renderLink={renderNavLink} footer={<SidebarUser />} />
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        brand={<Brand />}
        items={items}
        pathname={pathname}
        renderLink={renderNavLink}
        footer={<SidebarUser />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
            aria-label={t("nav.menu")}
          >
            <Menu size={18} />
          </button>
          <p className="truncate text-sm font-medium text-foreground">
            Travio <span className="text-muted-foreground">/</span> {current ? t(current.labelKey) : null}
          </p>
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={switchLanguage}
              disabled={isSwitching}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Languages size={16} aria-hidden="true" />
              {t("header.language")}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{t("header.signOut")}</span>
            </button>
          </div>
        </header>
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
