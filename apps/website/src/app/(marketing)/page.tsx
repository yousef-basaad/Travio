import type { Metadata } from "next";
import { ArrowRight, LayoutGrid, Clock3, Smile, Eye } from "lucide-react";
import { Hero } from "@/components/hero";
import { SectionHeader } from "@/components/section-header";
import { FeatureCard } from "@/components/feature-card";
import { ProductPreview } from "@/components/product-preview";
import { CtaSection } from "@/components/cta-section";
import { FEATURES } from "@/lib/features-content";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.siteTitle"),
    description: t("meta.homeDescription"),
    openGraph: {
      title: t("meta.siteTitle"),
      description: t("meta.homeDescription"),
      type: "website",
    },
  };
}

const WORKFLOW_STEPS = [
  "home.workflow.lead",
  "home.workflow.customer",
  "home.workflow.booking",
  "home.workflow.visaDocuments",
  "home.workflow.payment",
  "home.workflow.completion",
] as const;

const TRUST_POINTS = [
  { icon: LayoutGrid, title: "home.why.centralizedTitle", description: "home.why.centralizedDescription" },
  { icon: Clock3, title: "home.why.lessManualTitle", description: "home.why.lessManualDescription" },
  { icon: Smile, title: "home.why.experienceTitle", description: "home.why.experienceDescription" },
  { icon: Eye, title: "home.why.visibilityTitle", description: "home.why.visibilityDescription" },
] as const;

export default async function HomePage() {
  const t = await getT();
  return (
    <>
      <Hero
        eyebrow={t("home.hero.eyebrow")}
        headline={t("home.hero.headline")}
        supportingText={t("home.hero.supporting")}
        primaryCta={{ label: t("cta.startTrial"), href: "/signup" }}
        secondaryCta={{ label: t("cta.requestDemo"), href: "/contact", variant: "outline" }}
        visual={<ProductPreview variant="generic" />}
      />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow={t("home.platform.eyebrow")}
          title={t("home.platform.title")}
          description={t("home.platform.description")}
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.slug}
              icon={feature.icon}
              title={t(feature.title)}
              description={t(feature.summary)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow={t("home.workflow.eyebrow")}
          title={t("home.workflow.title")}
          description={t("home.workflow.description")}
        />
        <div className="mt-12 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-foreground">{t(step)}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <ArrowRight
                  aria-hidden="true"
                  size={18}
                  className="hidden shrink-0 rotate-90 text-muted-foreground lg:block lg:rotate-0 lg:rtl:rotate-180"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow={t("home.inside.eyebrow")}
          title={t("home.inside.title")}
          description={t("home.inside.description")}
        />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <ProductPreview variant="analytics" />
            <p className="text-center text-sm font-medium text-foreground">{t("home.inside.analytics")}</p>
          </div>
          <div className="space-y-3">
            <ProductPreview variant="customer-360" />
            <p className="text-center text-sm font-medium text-foreground">{t("home.inside.customer360")}</p>
          </div>
          <div className="space-y-3">
            <ProductPreview variant="booking-360" />
            <p className="text-center text-sm font-medium text-foreground">{t("home.inside.booking360")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader eyebrow={t("home.why.eyebrow")} title={t("home.why.title")} />
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
              >
                <point.icon size={20} />
              </span>
              <div>
                <h3 className="text-heading-sm text-foreground">{t(point.title)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(point.description)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaSection
        title={t("home.cta.title")}
        description={t("home.cta.description")}
        primaryCta={{ label: t("cta.startTrial"), href: "/signup" }}
        secondaryCta={{ label: t("cta.requestDemo"), href: "/contact" }}
      />
    </>
  );
}
