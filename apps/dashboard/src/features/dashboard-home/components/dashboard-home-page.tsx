import { TopDestinations } from "@/features/analytics";
import { KpiRow } from "./kpi-row";
import { BookingKanban } from "./booking-kanban";
import { QuickStatsDonut } from "./quick-stats-donut";
import { TeamActivity } from "./team-activity";
import { TodaySchedule } from "./today-schedule";
import { InboxPreview } from "./inbox-preview";
import { AiAssistantPanel } from "./ai-assistant-panel";

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): matches the
// reference's actual Operations Center composition more closely than the
// Phase 3 build did.
//
// 1. The greeting moved into the header (see DashboardHeader/
//    HeaderGreeting, rendered there only on this route) - the reference
//    never shows it as a page-body block.
// 2. The KPI row, booking Kanban, and the quick-stats/destinations/team
//    row all sit in the same left "main content" column as each other,
//    confined to it exactly like the reference (they stop before the
//    right rail, they don't run full-page-width above it) - the right
//    rail (Today's Schedule / Inbox / AI Assistant) runs the full
//    height alongside all three, starting at the same top edge as the
//    KPI row, not only below the Kanban board.
// 3. The reference's Operations Center screen has no separate
//    revenue-trend widget of its own (that lives on Reports/Finance,
//    neither of which this pass touches) - RevenueOverview no longer
//    renders on this page.
//
// Every widget still consumes the exact same hooks/services this app
// already had (useDashboardStats, useBookingAnalytics,
// useCustomerAnalytics, useBookings, useCustomers, useTeamMembers,
// useNotifications) - no new API route, no invented metric.
// TopDestinations is reused directly from the analytics feature (an
// honest EmptyState today - no destination aggregate exists in the API)
// as the approved stand-in for the reference's world map widget.
export function DashboardHomePage() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <KpiRow />
        <BookingKanban />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <QuickStatsDonut />
          <TopDestinations />
          <TeamActivity />
        </div>
      </div>
      <div className="space-y-5">
        <TodaySchedule />
        <InboxPreview />
        <AiAssistantPanel />
      </div>
    </div>
  );
}
