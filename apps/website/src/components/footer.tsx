import Link from "next/link";
import { Twitter, Linkedin, Instagram } from "lucide-react";
import { getT } from "@/lib/i18n/get-locale";
import type { MessageKey } from "@/lib/i18n/messages/en";

const FOOTER_SECTIONS = [
  {
    title: "footer.product",
    links: [
      { label: "nav.features", href: "/features" },
      { label: "nav.pricing", href: "/pricing" },
    ],
  },
  {
    title: "footer.solutions",
    links: [
      { label: "footer.travelAgencies", href: "/solutions#travel-agencies" },
      { label: "footer.visaTeams", href: "/solutions#visa-processing" },
      { label: "footer.corporateTravel", href: "/solutions#corporate-travel" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { label: "nav.about", href: "/about" },
      { label: "nav.contact", href: "/contact" },
    ],
  },
] as const satisfies readonly { title: MessageKey; links: readonly { label: MessageKey; href: string }[] }[];

// Placeholders - no real Travio social accounts exist yet, so these are
// inert (href="#") rather than pointing at a guessed/fabricated URL.
const SOCIAL_LINKS = [
  { label: "Twitter", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Instagram", icon: Instagram },
] as const;

export async function Footer() {
  const t = await getT();
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
              <span className="text-heading-sm text-foreground">{t("brand.name")}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(section.title)}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("footer.rights", { year: new Date().getFullYear() })}
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
