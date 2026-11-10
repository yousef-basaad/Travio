import type { CSSProperties, ReactNode } from "react";
import { BedDouble, Briefcase, Car, Mail, MapPin, MessageCircle, Phone, Plane, ShieldCheck, Stamp } from "lucide-react";
import { brandThemeVars } from "@travio/utils";
import type { AgencyService, PublicAgencySite } from "@travio/api";
import { translate } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { dirOf } from "@/lib/i18n/locales";
import { telHref, whatsappHref } from "../utils/contact-links";

const SERVICES: Record<AgencyService, { icon: ReactNode; labelKey: MessageKey }> = {
  flights: { icon: <Plane size={22} />, labelKey: "agencySite.service.flights" },
  hotels: { icon: <BedDouble size={22} />, labelKey: "agencySite.service.hotels" },
  visas: { icon: <Stamp size={22} />, labelKey: "agencySite.service.visas" },
  packages: { icon: <Briefcase size={22} />, labelKey: "agencySite.service.packages" },
  transfers: { icon: <Car size={22} />, labelKey: "agencySite.service.transfers" },
  insurance: { icon: <ShieldCheck size={22} />, labelKey: "agencySite.service.insurance" },
};

function ContactCard({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span dir="auto" className="block truncate font-medium text-foreground">
          {value}
        </span>
      </span>
    </>
  );
  const className = "flex items-center gap-3 rounded-xl border bg-card p-4";
  return href ? (
    <a href={href} className={`${className} transition-colors hover:border-primary/50`} rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function HeroText({ site, cta, ctaLabel, centered, buttonClass }: { site: PublicAgencySite; cta: string | null; ctaLabel: string; centered: boolean; buttonClass: string }) {
  return (
    <>
      <h1 className="font-heading text-4xl font-extrabold sm:text-5xl">{site.headline}</h1>
      {site.subheadline ? <p className={`mt-4 max-w-2xl text-lg opacity-90 ${centered ? "mx-auto" : ""}`}>{site.subheadline}</p> : null}
      {cta ? (
        <a
          href={cta}
          target={site.whatsapp ? "_blank" : undefined}
          rel="noopener noreferrer"
          className={`mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 ${buttonClass}`}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {ctaLabel}
        </a>
      ) : null}
    </>
  );
}

// The three page layouts an agency can choose, each with or without a
// cover image.
function Hero({ site, cta, ctaLabel }: { site: PublicAgencySite; cta: string | null; ctaLabel: string }) {
  const onColor = "bg-background text-foreground";
  const onPlain = "bg-primary text-primary-foreground";

  if (site.template === "split") {
    return (
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <HeroText site={site} cta={cta} ctaLabel={ctaLabel} centered={false} buttonClass={onPlain} />
        </div>
        {site.heroUrl ? (
          <img src={site.heroUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full rounded-2xl bg-primary" aria-hidden="true" />
        )}
      </section>
    );
  }

  if (site.template === "minimal") {
    return (
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <HeroText site={site} cta={cta} ctaLabel={ctaLabel} centered buttonClass={onPlain} />
        </div>
        {site.heroUrl ? <img src={site.heroUrl} alt="" className="mx-auto h-72 w-full max-w-6xl object-cover sm:rounded-2xl" /> : null}
      </section>
    );
  }

  // Classic: full-width, over the cover image when there is one. The dark
  // layer keeps white text readable on any photo.
  if (site.heroUrl) {
    return (
      <section className="relative overflow-hidden text-white">
        <img src={site.heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:py-32">
          <HeroText site={site} cta={cta} ctaLabel={ctaLabel} centered buttonClass={onColor} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <HeroText site={site} cta={cta} ctaLabel={ctaLabel} centered buttonClass={onColor} />
      </div>
    </section>
  );
}

// An agency's public page: its own logo, colors, words and contact
// details. Language comes from the agency's choice, not the visitor's
// Travio cookie. Text is rendered by React, so agency content can't
// inject markup.
export function AgencySitePage({ site }: { site: PublicAgencySite }) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(site.language, key, vars);
  const style = brandThemeVars({ primaryColor: site.primaryColor, sidebarColor: null }) as CSSProperties;
  const hasContact = Boolean(site.phone || site.whatsapp || site.email || site.city);
  const cta = site.whatsapp ? whatsappHref(site.whatsapp) : site.phone ? telHref(site.phone) : site.email ? `mailto:${site.email}` : null;

  return (
    <div lang={site.language} dir={dirOf(site.language)} style={style} className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          {site.logoUrl ? (
            <img src={site.logoUrl} alt="" className="h-10 w-10 rounded-md object-contain" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground" aria-hidden="true">
              {site.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold">{site.name}</p>
            {site.tagline ? <p className="truncate text-xs text-muted-foreground">{site.tagline}</p> : null}
          </div>
          <nav className="ms-auto hidden items-center gap-6 text-sm font-medium sm:flex">
            {site.services.length > 0 ? <a href="#services" className="hover:text-primary">{t("agencySite.nav.services")}</a> : null}
            {site.about ? <a href="#about" className="hover:text-primary">{t("agencySite.nav.about")}</a> : null}
            {hasContact ? <a href="#contact" className="hover:text-primary">{t("agencySite.nav.contact")}</a> : null}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Hero site={site} cta={cta} ctaLabel={t("agencySite.cta")} />

        {site.services.length > 0 ? (
          <section id="services" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14">
            <h2 className="text-center font-heading text-2xl font-bold">{t("agencySite.services.title")}</h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {site.services.map((service) => (
                <li key={service} className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                    {SERVICES[service].icon}
                  </span>
                  <span className="font-semibold">{t(SERVICES[service].labelKey)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {site.about ? (
          <section id="about" className="scroll-mt-4 bg-muted/40">
            <div className="mx-auto max-w-3xl px-4 py-14 text-center">
              <h2 className="font-heading text-2xl font-bold">{t("agencySite.about.title")}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{site.about}</p>
            </div>
          </section>
        ) : null}

        {hasContact ? (
          <section id="contact" className="mx-auto max-w-4xl scroll-mt-4 px-4 py-14">
            <h2 className="text-center font-heading text-2xl font-bold">{t("agencySite.contact.title")}</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {site.whatsapp ? (
                <ContactCard icon={<MessageCircle size={18} />} label={t("agencySite.contact.whatsapp")} value={site.whatsapp} href={whatsappHref(site.whatsapp)} />
              ) : null}
              {site.phone ? <ContactCard icon={<Phone size={18} />} label={t("agencySite.contact.phone")} value={site.phone} href={telHref(site.phone)} /> : null}
              {site.email ? <ContactCard icon={<Mail size={18} />} label={t("agencySite.contact.email")} value={site.email} href={`mailto:${site.email}`} /> : null}
              {site.city ? <ContactCard icon={<MapPin size={18} />} label={t("agencySite.contact.city")} value={site.city} /> : null}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {t("agencySite.footer", { name: site.name, year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
