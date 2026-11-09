import type { Metadata } from "next";
import { Building2, Stamp, Briefcase, Check } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { CtaSection } from "@/components/cta-section";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.solutionsTitle"),
    description: t("meta.solutionsDescription"),
    openGraph: {
      title: t("meta.solutionsTitle"),
      description: t("meta.solutionsDescription"),
      type: "website",
    },
  };
}

const SOLUTIONS = [
  { id: "travel-agencies", icon: Building2, key: "agencies" },
  { id: "visa-processing", icon: Stamp, key: "visa" },
  { id: "corporate-travel", icon: Briefcase, key: "corporate" },
] as const;

const POINTS = ["point1", "point2", "point3"] as const;

export default async function SolutionsPage() {
  const t = await getT();
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <SectionHeader
          eyebrow={t("solutions.eyebrow")}
          title={t("solutions.title")}
          description={t("solutions.description")}
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
            <h2 className="mt-4 text-heading-lg text-foreground">{t(`solutions.${solution.key}.title`)}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t(`solutions.${solution.key}.description`)}</p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  {t(`solutions.${solution.key}.${point}`)}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <CtaSection
        title={t("solutions.cta.title")}
        description={t("solutions.cta.description")}
        primaryCta={{ label: t("cta.startTrial"), href: "/signup" }}
        secondaryCta={{ label: t("cta.requestDemo"), href: "/contact" }}
      />
    </>
  );
}
