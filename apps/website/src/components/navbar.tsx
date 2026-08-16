"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@travio/ui";
import { cn } from "@travio/utils";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
      >
        T
      </span>
      <span className="text-heading-sm text-foreground">Travio</span>
    </Link>
  );
}

// Sticky top nav - real working mobile menu (not a reserved slot), same
// convention the dashboard's header explicitly deferred for its own
// future search/command-palette but is trivial and expected here on a
// public marketing site.
export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact">Request Demo</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
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
        <nav aria-label="Mobile" className="min-h-0 space-y-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="block rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/contact" onClick={() => setIsMobileOpen(false)}>
                Request Demo
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup" onClick={() => setIsMobileOpen(false)}>
                Start Free Trial
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
