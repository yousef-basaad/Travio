"use client";

import { useSession } from "@travio/auth";

// Time-of-day greeting - pure presentation, no data fetch beyond the
// already-loaded session profile ((dashboard)/layout.tsx already
// requires an authenticated profile to reach this page at all, so
// profile is only ever null for the one render before SessionProvider
// hydrates).
function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function useGreeting() {
  const { profile } = useSession();
  const greeting = greetingForHour(new Date().getHours());
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

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">
        {greeting}
        {firstName ? `, ${firstName}` : ""} 👋
      </p>
      <p className="truncate text-xs text-muted-foreground">Here&rsquo;s an overview of your agency today.</p>
    </div>
  );
}
