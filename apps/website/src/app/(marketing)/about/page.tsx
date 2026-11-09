import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { CtaSection } from "@/components/cta-section";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.aboutTitle"),
    description: t("meta.aboutDescription"),
    openGraph: {
      title: t("meta.aboutTitle"),
      description: t("meta.aboutDescription"),
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const t = await getT();
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 sm:pt-28 text-center">
        <p className="text-caption font-semibold uppercase tracking-wider text-primary">
          {t("about.eyebrow")}
        </p>
        <h1 className="mt-3 text-heading-xl text-foreground">
          {t("about.headline")}
        </h1>
      </section>

      <section className="mx-auto max-w-3xl space-y-16 px-6 pb-24">
        <div>
          <SectionHeader align="left" eyebrow={t("about.problem.eyebrow")} title={t("about.problem.title")} />
          <p className="mt-4 text-muted-foreground">{t("about.problem.body")}</p>
        </div>

        <div>
          <SectionHeader align="left" eyebrow={t("about.solution.eyebrow")} title={t("about.solution.title")} />
          <p className="mt-4 text-muted-foreground">{t("about.solution.body")}</p>
        </div>
      </section>

      <CtaSection
        title={t("about.cta.title")}
        description={t("about.cta.description")}
        primaryCta={{ label: t("cta.startTrial"), href: "/signup" }}
        secondaryCta={{ label: t("cta.requestDemo"), href: "/contact" }}
      />
    </>
  );
}
