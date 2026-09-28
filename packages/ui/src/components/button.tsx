import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@travio/utils";

const buttonVariants = cva(
  // Design System v2.0: transition-all (not just colors) so the subtle
  // active:scale press below animates smoothly too; duration-fast/
  // ease-default come from tokens.css - the same easing every
  // interactive primitive in this system now shares.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast ease-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // default/destructive are the original variant names and every
        // existing call site in the app uses them (or omits variant
        // entirely, relying on "default") - kept exactly as-is.
        // primary/secondary/danger are the design system's formal
        // vocabulary added alongside them: primary is an alias for
        // default, danger an alias for destructive (same classes, new
        // name), and secondary is genuinely new (no call site used a
        // "secondary" button before this). hover states use the
        // explicit --primary-hover token instead of the old bg-primary/90
        // opacity trick.
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // "default"/"md" are identical - default is kept so every
        // existing call site that omits `size` renders unchanged; "md"
        // is the design system's explicit name for the same size.
        default: "h-9 px-4 py-2",
        md: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
