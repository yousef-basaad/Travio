import type { Metadata } from "next";
import { Check } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { ProductPreview } from "@/components/product-preview";
import { CtaSection } from "@/components/cta-section";
import { FEATURES } from "@/lib/features-content";

export const metadata: Metadata = {
  title: "Features - Travio",
  description:
    "CRM, booking management, visa operations, finance, documents, and analytics - every module travel agencies need, in one platform.",
  openGraph: {
    title: "Features - Travio",
    description:
      "CRM, booking management, visa operations, finance, documents, and analytics - every module travel agencies need, in one platform.",
    type: "website",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow="Features"
          title="Every module your agency needs"
          description="Six connected modules that share the same customer, booking, and financial records - not six separate tools bolted together."
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
              <h2 className="mt-4 text-heading-lg text-foreground">{feature.title}</h2>
              <p className="mt-3 text-muted-foreground">{feature.description}</p>
              <ul className="mt-6 space-y-3">
                {feature.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    {benefit}
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
        title="See every module in action"
        description="Book a walkthrough with our team or start exploring Travio yourself."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Request Demo", href: "/contact" }}
      />
    </>
  );
}
