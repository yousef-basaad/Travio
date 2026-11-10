import type { Metadata } from "next";
import { Check } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { ProductPreview } from "@/components/product-preview";
import { CtaSection } from "@/components/cta-section";
import { FEATURES } from "@/lib/features-content";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.featuresTitle"),
    description: t("meta.featuresDescription"),
    openGraph: {
      title: t("meta.featuresTitle"),
      description: t("meta.featuresDescription"),
      type: "website",
    },
  };
}

export default async function FeaturesPage() {
  const t = await getT();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow={t("featuresPage.eyebrow")}
          title={t("featuresPage.title")}
          description={t("featuresPage.description")}
        />
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-6 pb-24">
        {FEATURES.map((feature, index) => (
          <section key={feature.slug} id={feature.slug} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary"
              >
                <feature.icon size={24} />
              </span>
              <h2 className="mt-4 text-heading-lg text-foreground">{t(feature.title)}</h2>
              <p className="mt-3 text-muted-foreground">{t(feature.description)}</p>
              <ul className="mt-6 space-y-3">
                {feature.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    {t(benefit)}
                  </li>
                ))}
              </ul>
            </div>
            <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
              <ProductPreview variant={feature.visual ?? "generic"} />
            </div>
          </section>
        ))}
      </div>

      <CtaSection
        title={t("featuresPage.cta.title")}
        description={t("featuresPage.cta.description")}
        primaryCta={{ label: t("cta.startTrial"), href: "/signup" }}
        secondaryCta={{ label: t("cta.requestDemo"), href: "/contact" }}
      />
    </>
  );
}
