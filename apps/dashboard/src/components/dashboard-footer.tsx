"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@travio/utils";
import { formatDateTime } from "@travio/utils";

// Design System v2.5 (Product-8.2 Phase 2): the reference's shell
// footer. "Last updated" is the real moment this bar last rendered/
// refreshed (Date.now(), captured in state so it only changes on an
// actual refresh, not on every render) - not a fabricated "synced at"
// timestamp from a backend field that doesn't exist. Refresh calls the
// real Next.js router.refresh() (re-runs server components on the
// current route) so the action genuinely does something, not a
// decorative spinner. Terms/Privacy link to real routes (Product-8.2
// Phase 2's own placeholder pages) rather than a dead href.
export function DashboardFooter() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setLastUpdated(new Date());
    window.setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>Last updated: {formatDateTime(lastUpdated.toISOString())}</span>
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh"
          className="rounded-md p-1 transition-colors duration-fast hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span>© {new Date().getFullYear()} Travio. All rights reserved.</span>
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
