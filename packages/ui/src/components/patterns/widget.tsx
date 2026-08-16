import type { ReactNode } from "react";
import { cn } from "@travio/utils";
import { Card, CardHeader, CardContent } from "../card";

export interface WidgetProps {
  title: string;
  description?: string;
  /** Right-aligned header slot - typically a "View all" link/button. */
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  className?: string;
}

// Design System v2.5 (Product-8.2 Phase 3): the reference's dashboard
// widgets (Today's Schedule, Inbox, Quick Stats, Team, ...) all share one
// shape - a Card with a title/description on the left and an optional
// "View all"-style link on the right. Formalizes that repeated
// composition (Card + CardHeader + CardContent, previously written out
// by hand in every one of these small dashboard cards) into a single
// primitive instead of the same six-line header block copy-pasted
// across five-plus widgets on one page.
export function Widget({ title, description, action, children, contentClassName, className }: WidgetProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
