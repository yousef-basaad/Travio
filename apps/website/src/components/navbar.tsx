"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@travio/ui";
import { cn } from "@travio/utils";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { LanguageSwitch } from "./language-switch";

const NAV_LINKS = [
  { label: "nav.features", href: "/features" },
  { label: "nav.solutions", href: "/solutions" },
  { label: "nav.pricing", href: "/pricing" },
  { label: "nav.about", href: "/about" },
  { label: "nav.contact", href: "/contact" },
] as const satisfies readonly { label: MessageKey; href: string }[];

function Logo() {
  const t = useT();
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
      >
        T
      </span>
      <span className="text-heading-sm text-foreground">{t("brand.name")}</span>
    </Link>
  );
}

// Sticky top nav - real working mobile menu (not a reserved slot), same
// convention the dashboard's header explicitly deferred for its own
// future search/command-palette but is trivial and expected here on a
// public marketing site.
export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const t = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav aria-label={t("nav.main")} className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitch />
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact">{t("cta.requestDemo")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t("cta.startTrial")}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label={t(isMobileOpen ? "nav.closeMenu" : "nav.openMenu")}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMobileOpen((value) => !value)}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "grid overflow-hidden border-t border-border transition-all duration-base ease-default md:hidden",
          isMobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <nav aria-label={t("nav.mobile")} className="min-h-0 space-y-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="block rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/contact" onClick={() => setIsMobileOpen(false)}>
                {t("cta.requestDemo")}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup" onClick={() => setIsMobileOpen(false)}>
                {t("cta.startTrial")}
              </Link>
            </Button>
            <LanguageSwitch className="justify-center" onSwitched={() => setIsMobileOpen(false)} />
          </div>
        </nav>
      </div>
    </header>
  );
}
