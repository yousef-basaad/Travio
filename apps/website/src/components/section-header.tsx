import { cn } from "@travio/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

// Shared "eyebrow + heading + description" block repeated at the top of
// every marketing section on this site (Features/Product Workflow/
// Dashboard Preview/Trust/CTA) - one component instead of each section
// hand-rolling its own heading markup.
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-caption font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-heading-xl text-foreground">{title}</h2>
      {description ? (
        <p className="mt-4 text-base text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
