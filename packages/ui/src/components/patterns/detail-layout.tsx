import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "../card";
import { Tabs } from "../tabs";

export interface DetailLayoutProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  ariaLabel: string;
  /** The active tab's content - the caller still owns the tab->content mapping. */
  children: ReactNode;
}

// Formalizes the Card + tablist + CardContent shell repeated by
// CustomerTabs and BookingTabs (each owning its own useState<Tab> and
// tab->content ternary chain) - this only pairs Card with Tabs; the
// caller still decides which content to render for the active tab.
export function DetailLayout({ tabs, activeTab, onTabChange, ariaLabel, children }: DetailLayoutProps) {
  return (
    <Card>
      <CardHeader className="space-y-0 p-0">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} aria-label={ariaLabel} />
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
