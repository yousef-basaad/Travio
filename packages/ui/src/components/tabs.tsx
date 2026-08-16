import { cn } from "@travio/utils";

// Formalizes the role="tablist"/role="tab" markup previously copy-pasted
// independently in booking-tabs.tsx and customer-tabs.tsx. Owns only the
// tab strip - content switching stays with the caller (see DetailLayout,
// which pairs this with Card for the full pattern), same as those two
// components already did.
export interface TabsProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  "aria-label": string;
}

// Design System v2.2: shares the same duration-fast/ease-default motion
// every other interactive primitive (Button/Badge/Card/Table row) uses,
// and the active tab now uses the design system's rounded-md consistently.
export function Tabs({ tabs, activeTab, onTabChange, "aria-label": ariaLabel }: TabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1 border-b p-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-default",
            activeTab === tab
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
