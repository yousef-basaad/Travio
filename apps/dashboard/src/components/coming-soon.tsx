import type { ReactNode } from "react";
import { PageHeader, Card, CardContent, EmptyState } from "@travio/ui";

export interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
}

// Design System v2.5 (Product-8.2 Phase 2): shared shell for every
// sidebar item the reference lists that has no backing feature/route
// today (Documents as a standalone page, Calendar, Inbox, Activities,
// AI Assistant, Help Center, plus the footer's Terms/Privacy) - matches
// the exact honest-placeholder pattern the Visa Center page already
// established (Phase UI-6): a real route, a real PageHeader, and an
// EmptyState that says plainly what exists today and where, never a
// dead link and never a faked feature. One shared component instead of
// six-plus near-identical page files.
export function ComingSoon({ title, description, icon, emptyTitle, emptyDescription, action }: ComingSoonProps) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-6">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} action={action} />
        </CardContent>
      </Card>
    </div>
  );
}
