import * as React from "react";
import { cn } from "@travio/utils";

export type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Real image URL - omit entirely rather than pass a placeholder/fake one. */
  src?: string | null;
  /** Used both for the fallback initials and the image's alt text. */
  name: string;
  size?: AvatarSize;
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

// Design System v2.5 (Product-8.2 Phase 2): formalizes the initials-circle
// markup that was previously hand-rolled independently in
// DashboardHeader's UserMenu (`bg-gradient-to-br from-primary to-primary-
// hover`) - same visual, now a single shared primitive so the sidebar's
// new bottom user card doesn't duplicate it a third time. Falls back to
// initials whenever `src` is absent or fails to load (onError swaps to
// the fallback rather than leaving a broken image icon) - never
// fabricates a placeholder avatar image.
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, size = "md", className, ...props }, ref) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const showImage = Boolean(src) && !imageFailed;

    return (
      <span
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-hover font-semibold text-primary-foreground",
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {showImage ? (
          // Plain <img>, not next/image - this package has no Next.js
          // dependency and stays framework-agnostic (consuming apps
          // already run their own eslint-config-next, which doesn't
          // reach into this package's own source).
          <img
            src={src as string}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";
