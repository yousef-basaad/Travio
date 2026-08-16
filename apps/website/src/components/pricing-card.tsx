import Link from "next/link";
import type { Route } from "next";
import { Check } from "lucide-react";
import { Button, Card, CardContent, CardHeader } from "@travio/ui";
import { cn } from "@travio/utils";

export interface PricingCardProps {
  name: string;
  price: string;
  billingNote?: string;
  description: string;
  features: readonly string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
}

// Pricing values are explicitly placeholders per this phase's spec -
// every number lives here as a plain prop, not hardcoded per-plan
// markup, so replacing them later (real pricing) is a one-line data
// change in pricing/page.tsx, not a component rewrite.
export function PricingCard({
  name,
  price,
  billingNote,
  description,
  features,
  cta,
  highlighted = false,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col",
        highlighted && "border-primary shadow-lg ring-1 ring-primary",
      )}
    >
      <CardHeader className="space-y-3 pb-4">
        {highlighted ? (
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Most Popular
          </span>
        ) : null}
        <h3 className="text-heading-md text-foreground">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-heading-xl text-foreground">{price}</span>
          {billingNote ? (
            <span className="text-sm text-muted-foreground">{billingNote}</span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-6 pt-0">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
              <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <Button asChild variant={highlighted ? "primary" : "outline"} className="w-full">
          {/* href flows through a plain `string` prop (PricingCardProps),
              which loses the literal type typedRoutes' Route union
              needs - every caller only ever passes a real route, so
              this cast is safe, not a loophole. */}
          <Link href={cta.href as Route}>{cta.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
