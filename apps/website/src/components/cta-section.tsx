import Link from "next/link";
import type { Route } from "next";
import { Button } from "@travio/ui";

export interface CtaSectionProps {
  title: string;
  description?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

// Final strong conversion section - reused at the bottom of every
// marketing page (Homepage, Features, Solutions, Pricing), same
// copy-in-as-props shape as Hero so each page supplies its own message.
export function CtaSection({ title, description, primaryCta, secondaryCta }: CtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-xl border border-border bg-primary px-8 py-16 text-center sm:px-16">
        <h2 className="text-heading-xl text-primary-foreground">{title}</h2>
        {description ? (
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">{description}</p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            {/* href flows through a plain `string` prop (CtaSectionProps),
                which loses the literal type typedRoutes' Route union
                needs - every caller only ever passes a real route, so
                this cast is safe, not a loophole (same convention as
                AppSidebar's renderLink in packages/ui). */}
            <Link href={primaryCta.href as Route}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href={secondaryCta.href as Route}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
