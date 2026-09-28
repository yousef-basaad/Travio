import * as React from "react";
import { cn } from "@travio/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Design System v2.2: opt-in hover treatment (border tint + raised
   * shadow) for cards that are themselves clickable/navigable (e.g. a
   * summary card linking to a detail page). Off by default - a plain
   * `<Card>` still renders exactly as before, this never changes the
   * visual result of any existing usage that doesn't pass it.
   */
  interactive?: boolean;
}

// Design System v2.0: rounded-lg/shadow-sm now resolve to the new
// (subtler, slightly larger-radius) tokens.css values automatically -
// transition-shadow so a consumer adding `hover:shadow-md` (e.g. a
// clickable summary card) animates instead of snapping.
//
// Design System v2.4 (Product-8.1): border-border/60 (was full-opacity
// border-border) - the reference products (Linear/Vercel/Stripe) define
// card edges mostly through shadow-sm, with a hairline border that reads
// as a faint seam rather than a hard outline. shadow-sm carries more of
// the "this is a raised surface" job than before.
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm transition-shadow duration-base",
        interactive && "hover:border-primary/30 hover:shadow-md",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";
