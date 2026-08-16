import type { Metadata } from "next";
import { ArrowRight, LayoutGrid, Clock3, Smile, Eye } from "lucide-react";
import { Hero } from "@/components/hero";
import { SectionHeader } from "@/components/section-header";
import { FeatureCard } from "@/components/feature-card";
import { ProductPreview } from "@/components/product-preview";
import { CtaSection } from "@/components/cta-section";
import { FEATURES } from "@/lib/features-content";

export const metadata: Metadata = {
  title: "Travio - Run Your Travel Agency From One Platform",
  description:
    "Manage bookings, customers, visas, documents, payments, and operations in one unified workspace built for travel agencies.",
  openGraph: {
    title: "Travio - Run Your Travel Agency From One Platform",
    description:
      "Manage bookings, customers, visas, documents, payments, and operations in one unified workspace built for travel agencies.",
    type: "website",
  },
};

const WORKFLOW_STEPS = [
  "Lead",
  "Customer",
  "Booking",
  "Visa / Documents",
  "Payment",
  "Completion",
] as const;

const TRUST_POINTS = [
  {
    icon: LayoutGrid,
    title: "Centralized operations",
    description: "CRM, bookings, visas, documents, and finance in one workspace - not six disconnected tools.",
  },
  {
    icon: Clock3,
    title: "Less manual work",
    description: "One booking record ties services, documents, and invoices together automatically.",
  },
  {
    icon: Smile,
    title: "Better customer experience",
    description: "A complete Customer 360 view means every team member sees the same up-to-date picture.",
  },
  {
    icon: Eye,
    title: "Real-time visibility",
    description: "Revenue, booking status, and customer growth, visible the moment they change.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Travel Agency Operating System"
        headline="Run your travel agency from one powerful platform."
        supportingText="Manage bookings, customers, visas, documents, payments, and operations in one unified workspace."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Request Demo", href: "/contact", variant: "outline" }}
        visual={<ProductPreview variant="generic" />}
      />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="Platform"
          title="Everything your agency runs on"
          description="Six connected modules, built specifically for travel agency operations."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.slug}
              icon={feature.icon}
              title={feature.title}
              description={feature.summary}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="How it works"
          title="One workflow, start to finish"
          description="Every trip follows the same clear path through your agency."
        />
        <div className="mt-12 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-foreground">{step}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <ArrowRight
                  aria-hidden="true"
                  size={18}
                  className="hidden shrink-0 rotate-90 text-muted-foreground lg:block lg:rotate-0"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="Inside Travio"
          title="Built for the way agencies actually work"
          description="A closer look at the workspace your team uses every day."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <ProductPreview variant="analytics" />
            <p className="text-center text-sm font-medium text-foreground">Analytics Dashboard</p>
          </div>
          <div className="space-y-3">
            <ProductPreview variant="customer-360" />
            <p className="text-center text-sm font-medium text-foreground">Customer 360</p>
          </div>
          <div className="space-y-3">
            <ProductPreview variant="booking-360" />
            <p className="text-center text-sm font-medium text-foreground">Booking 360</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader eyebrow="Why Travio" title="Why travel agencies choose Travio" />
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
                <h3 className="text-heading-sm text-foreground">{point.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaSection
        title="Ready to bring your agency into one platform?"
        description="Start a free trial or book a demo with our team - no credit card required."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Request Demo", href: "/contact" }}
      />
    </>
  );
}
