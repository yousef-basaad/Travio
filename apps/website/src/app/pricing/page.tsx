import type { Metadata } from "next";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { SectionHeader } from "@/components/section-header";
import { PricingCard } from "@/components/pricing-card";
import { CtaSection } from "@/components/cta-section";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.pricingTitle"),
    description: t("meta.pricingDescription"),
    openGraph: {
      title: t("meta.pricingTitle"),
      description: t("meta.pricingDescription"),
      type: "website",
    },
  };
}

// Placeholder pricing - every value below is illustrative (per this
// phase's explicit spec) and lives in this one array so replacing real
// prices later is a data change, not a template change.
const PLANS = [
  { key: "starter", price: "$49", monthly: true, features: 4, cta: "startTrial" },
  { key: "growth", price: "$149", monthly: true, features: 6, cta: "startTrial", highlighted: true },
  { key: "enterprise", price: null, monthly: false, features: 5, cta: "requestDemo" },
] as const;

export default async function PricingPage() {
  const t = await getT();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow={t("pricing.eyebrow")}
          title={t("pricing.title")}
          description={t("pricing.description")}
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.key}
              name={t(`pricing.${plan.key}.name`)}
              price={plan.price ?? t("pricing.custom")}
              billingNote={plan.monthly ? t("pricing.perMonth") : undefined}
              description={t(`pricing.${plan.key}.description`)}
              features={Array.from({ length: plan.features }, (_, index) =>
                t(`pricing.${plan.key}.feature${index + 1}` as MessageKey),
              )}
              cta={
                plan.cta === "startTrial"
                  ? { label: t("cta.startTrial"), href: "/signup" }
                  : { label: t("cta.requestDemo"), href: "/contact" }
              }
              highlighted={"highlighted" in plan && plan.highlighted}
              highlightLabel={t("pricing.mostPopular")}
            />
          ))}
        </div>
      </section>

      <CtaSection
        title={t("pricing.cta.title")}
        description={t("pricing.cta.description")}
        primaryCta={{ label: t("cta.requestDemo"), href: "/contact" }}
      />
    </>
  );
}
