"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@travio/utils";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Design System v2.5 (Product-8.2 Phase 2): the reference's shell
// footer. "Last updated" is the real moment this bar last rendered/
// refreshed (Date.now(), captured in state so it only changes on an
// actual refresh, not on every render) - not a fabricated "synced at"
// timestamp from a backend field that doesn't exist. Refresh calls the
// real Next.js router.refresh() (re-runs server components on the
// current route) so the action genuinely does something, not a
// decorative spinner. Terms/Privacy link to real routes (Product-8.2
// Phase 2's own placeholder pages) rather than a dead href.
//
// The time is set after mount, not during render: the server and the
// browser would each compute their own "now", and a page load that
// crosses a minute boundary made them disagree (a hydration error).
export function DashboardFooter() {
  const router = useRouter();
  const t = useT();
  const format = useFormat();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setLastUpdated(new Date());
    window.setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>{lastUpdated ? t("footer.lastUpdated", { time: format.dateTime(lastUpdated.toISOString()) }) : null}</span>
        <button
          type="button"
          onClick={handleRefresh}
          aria-label={t("footer.refresh")}
          className="rounded-md p-1 transition-colors duration-fast hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
        <Link href="/terms" className="hover:text-foreground hover:underline">
          {t("footer.terms")}
        </Link>
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          {t("footer.privacy")}
        </Link>
      </div>
    </footer>
  );
}
