import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface EmptyStateProps {
  /**
   * Original single-message form - every existing caller (9+ list/table
   * components) uses this and renders identically to before.
   */
  message?: string;
  /** Design system v1.5 form: a heading instead of/alongside a message. */
  title?: string;
  description?: string;
  /** Optional slot for a call-to-action button, e.g. "Create your first X". */
  action?: ReactNode;
  /**
   * Design System v2.0: optional icon/illustration slot, rendered above
   * the title in a muted circular badge (matches the icon treatment
   * used elsewhere in the system, e.g. the sidebar brand mark) - no
   * illustration asset is bundled here, callers pass their own icon
   * (e.g. a lucide-react component).
   */
  icon?: ReactNode;
  className?: string;
}

// Generic empty state for a list/section that has no items yet.
// Backward compatible: message-only (the original API) still renders the
// exact same markup as before; title/description/action/icon are additive.
export function EmptyState({
  message,
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {icon}
        </div>
      ) : null}
      {title ? <h2 className="text-sm font-medium text-foreground">{title}</h2> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
