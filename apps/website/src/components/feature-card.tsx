import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@travio/ui";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Icon + title + description - the one repeating shape behind every
// feature grid on this site (Homepage's Features section, the Features
// page's detail sections). Reuses @travio/ui's Card so it automatically
// picks up the design system's radius/shadow/border tokens.
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Icon size={20} />
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="text-heading-sm text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
