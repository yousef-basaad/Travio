import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { PricingCard } from "@/components/pricing-card";
import { CtaSection } from "@/components/cta-section";

export const metadata: Metadata = {
  title: "Pricing - Travio",
  description: "Simple, transparent pricing for travel agencies of every size.",
  openGraph: {
    title: "Pricing - Travio",
    description: "Simple, transparent pricing for travel agencies of every size.",
    type: "website",
  },
};

// Placeholder pricing - every value below is illustrative (per this
// phase's explicit spec) and lives in this one array so replacing real
// prices later is a data change, not a template change.
const PLANS = [
  {
    name: "Starter",
    price: "$49",
    billingNote: "/ month",
    description: "For small agencies getting started with CRM and bookings.",
    features: [
      "Up to 3 team members",
      "CRM and booking management",
      "Basic finance (invoices and payments)",
      "Email support",
    ],
    cta: { label: "Start Free Trial", href: "/signup" },
  },
  {
    name: "Growth",
    price: "$149",
    billingNote: "/ month",
    description: "For growing agencies that need visa operations and analytics.",
    features: [
      "Up to 15 team members",
      "Everything in Starter",
      "Visa operations desk",
      "Analytics dashboard",
      "Document management",
      "Priority support",
    ],
    cta: { label: "Start Free Trial", href: "/signup" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-branch agencies and corporate travel operations.",
    features: [
      "Unlimited team members",
      "Everything in Growth",
      "Multi-branch support",
      "Dedicated onboarding",
      "Custom contract and SLA",
    ],
    cta: { label: "Request Demo", href: "/contact" },
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Placeholder pricing shown below - contact us for current rates. Every plan includes the core Travio workspace."
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </section>

      <CtaSection
        title="Not sure which plan fits?"
        description="Talk to our team and we'll help you find the right plan for your agency."
        primaryCta={{ label: "Request Demo", href: "/contact" }}
      />
    </>
  );
}
