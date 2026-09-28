import type { Metadata } from "next";
import { Building2, Stamp, Briefcase, Check } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { CtaSection } from "@/components/cta-section";

export const metadata: Metadata = {
  title: "Solutions - Travio",
  description:
    "Travio for travel agencies, visa processing teams, and corporate travel management - one platform, tailored to how each team works.",
  openGraph: {
    title: "Solutions - Travio",
    description:
      "Travio for travel agencies, visa processing teams, and corporate travel management - one platform, tailored to how each team works.",
    type: "website",
  },
};

const SOLUTIONS = [
  {
    id: "travel-agencies",
    icon: Building2,
    title: "Travel Agencies",
    description:
      "Run your whole agency - leads, customers, bookings, visas, documents, and finance - from one workspace your whole team shares.",
    points: [
      "A single Customer 360 view for every agent",
      "Bookings that keep flights, hotels, and transfers together",
      "Finance reconciled against the same booking records",
    ],
  },
  {
    id: "visa-processing",
    icon: Stamp,
    title: "Visa Processing Teams",
    description:
      "Give your visa desk a dedicated, owned queue - applications tracked by status and assigned officer, linked back to the customer and booking that need them.",
    points: [
      "A visa queue owned by your visa officers, not a shared inbox",
      "Status lifecycle from draft to approved",
      "Every application linked to its customer and booking",
    ],
  },
  {
    id: "corporate-travel",
    icon: Briefcase,
    title: "Corporate Travel Management",
    description:
      "Manage corporate accounts with the same booking and finance tooling your leisure business runs on - centralized, auditable, and easy to report on.",
    points: [
      "Centralized records for repeat corporate accounts",
      "Invoicing and payment tracking per booking",
      "Real-time visibility into account activity",
    ],
  },
] as const;

export default function SolutionsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow="Solutions"
          title="Built for how your team works"
          description="Travio adapts to travel agencies, visa processing teams, and corporate travel desks alike."
        />
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-6 pb-24">
        {SOLUTIONS.map((solution) => (
          <section
            key={solution.id}
            id={solution.id}
            className="scroll-mt-20 rounded-xl border border-border bg-card p-8 sm:p-10"
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <solution.icon size={24} />
            </span>
            <h2 className="mt-4 text-heading-lg text-foreground">{solution.title}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{solution.description}</p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {solution.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <CtaSection
        title="Find the right fit for your team"
        description="Talk to us about your workflow, or start exploring Travio today."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Request Demo", href: "/contact" }}
      />
    </>
  );
}
