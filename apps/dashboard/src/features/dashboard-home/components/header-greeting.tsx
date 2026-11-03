"use client";

import { useSession } from "@travio/auth";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Time-of-day greeting - pure presentation, no data fetch beyond the
// already-loaded session profile ((dashboard)/layout.tsx already
// requires an authenticated profile to reach this page at all, so
// profile is only ever null for the one render before SessionProvider
// hydrates).
function greetingForHour(hour: number): MessageKey {
  if (hour < 12) return "greeting.morning";
  if (hour < 18) return "greeting.afternoon";
  return "greeting.evening";
}

function useGreeting() {
  const { profile } = useSession();
  const t = useT();
  const greeting = t(greetingForHour(new Date().getHours()));
  const firstName = profile?.fullName.trim().split(/\s+/)[0];
  return { greeting, firstName };
}

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): the
// reference's Operations Center greeting doesn't live in the page body -
// it sits directly in the header bar, to the left of the search box
// ("مرحباً محمد 👋" / "إليك نظرة عامة على أعمالك اليوم" as a two-line
// block replacing the breadcrumb, only on this one route). This replaces
// the old page-body <GreetingBanner> (Phase 3) with a compact header
// variant that DashboardHeader renders in place of its breadcrumb only
// when `pathname === "/"` - every other route keeps its plain
// breadcrumb title unchanged. Same data as before (greetingForHour +
// profile.fullName), just relocated and resized to fit a 64px header
// row instead of a page-level heading.
export function HeaderGreeting() {
  const { greeting, firstName } = useGreeting();
  const t = useT();

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">
        {firstName ? t("greeting.withName", { greeting, name: firstName }) : greeting} 👋
      </p>
      <p className="truncate text-xs text-muted-foreground">{t("greeting.subtitle")}</p>
    </div>
  );
}
