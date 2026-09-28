import Link from "next/link";
import { Twitter, Linkedin, Instagram } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Travel Agencies", href: "/solutions#travel-agencies" },
      { label: "Visa Processing Teams", href: "/solutions#visa-processing" },
      { label: "Corporate Travel", href: "/solutions#corporate-travel" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

// Placeholders - no real Travio social accounts exist yet, so these are
// inert (href="#") rather than pointing at a guessed/fabricated URL.
const SOCIAL_LINKS = [
  { label: "Twitter", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Instagram", icon: Instagram },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
              >
                T
              </span>
              <span className="text-heading-sm text-foreground">Travio</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One operating system for travel businesses.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Travio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="text-muted-foreground transition-colors duration-fast hover:text-foreground"
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
