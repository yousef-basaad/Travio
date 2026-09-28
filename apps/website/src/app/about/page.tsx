import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { CtaSection } from "@/components/cta-section";

export const metadata: Metadata = {
  title: "About - Travio",
  description: "Travio's mission: one operating system for travel businesses.",
  openGraph: {
    title: "About - Travio",
    description: "Travio's mission: one operating system for travel businesses.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 sm:pt-28 text-center">
        <p className="text-caption font-semibold uppercase tracking-wider text-primary">
          Our Mission
        </p>
        <h1 className="mt-3 text-heading-xl text-foreground">
          One operating system for travel businesses.
        </h1>
      </section>

      <section className="mx-auto max-w-3xl space-y-16 px-6 pb-24">
        <div>
          <SectionHeader align="left" eyebrow="The Problem" title="Travel agencies use disconnected tools" />
          <p className="mt-4 text-muted-foreground">
            Most travel agencies run on a patchwork of spreadsheets, messaging apps, and
            single-purpose tools - one for leads, another for bookings, another for finance,
            and none of them talking to each other. Information gets lost between handoffs,
            and no one has a single, reliable view of a customer, a booking, or the business as
            a whole.
          </p>
        </div>

        <div>
          <SectionHeader align="left" eyebrow="The Solution" title="One operating system for travel businesses" />
          <p className="mt-4 text-muted-foreground">
            Travio brings CRM, booking management, visa operations, finance, documents, and
            analytics into a single, connected workspace. Every lead, customer, booking, and
            invoice lives in one place, so your team always works from the same up-to-date
            picture - and agency owners always know where the business stands.
          </p>
        </div>
      </section>

      <CtaSection
        title="See Travio for yourself"
        description="Start a free trial or talk to our team about your agency's workflow."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Request Demo", href: "/contact" }}
      />
    </>
  );
}
