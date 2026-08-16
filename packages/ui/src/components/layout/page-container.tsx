import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

// Formalizes the dashboard's main content area - consistent padding and
// scroll behavior beside the sidebar/below the header. Design System
// v2.2: content is capped at a max width and centered so pages stay
// readable on very wide/ultrawide monitors instead of stretching
// edge-to-edge - a no-op on every normal desktop/laptop viewport (which
// is narrower than the cap), so no existing page's layout changes there.
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("flex-1 overflow-y-auto p-6 sm:p-8", className)}>
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </main>
  );
}
