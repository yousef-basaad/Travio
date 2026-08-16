import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@travio/ui";

export interface HeroCta {
  label: string;
  href: string;
  variant?: "primary" | "outline";
}

export interface HeroProps {
  eyebrow?: string;
  headline: string;
  supportingText: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  visual?: ReactNode;
}

// Reusable hero shell - the homepage is the only current caller, but
// this stays parameterized (not hardcoded copy) so /features or a
// future landing variant can reuse the same shape with different
// headline/CTA copy.
export function Hero({ eyebrow, headline, supportingText, primaryCta, secondaryCta, visual }: HeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <p className="text-caption font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-display text-foreground">{headline}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{supportingText}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant={primaryCta.variant === "outline" ? "outline" : "primary"}>
            {/* href flows through a plain `string` prop (HeroCta), which
                loses the literal type typedRoutes' Route union needs -
                every caller only ever passes a real route, so this cast
                is safe, not a loophole. */}
            <Link href={primaryCta.href as Route}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button asChild size="lg" variant={secondaryCta.variant === "primary" ? "primary" : "outline"}>
              <Link href={secondaryCta.href as Route}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {visual ? <div className="mx-auto mt-16 max-w-4xl">{visual}</div> : null}
    </section>
  );
}
