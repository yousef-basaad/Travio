import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

// No unified calendar/scheduling feature exists yet (no shared events
// table, no booking-departure/visa-deadline aggregation service) - an
// honest placeholder rather than a calendar showing nothing real.
export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendar"
      description="Your agency's schedule at a glance"
      icon={<CalendarDays size={20} />}
      emptyTitle="Calendar view is coming soon"
      emptyDescription="A unified schedule across bookings, visa deadlines, and team activity isn't available yet - booking dates are visible today from the Bookings list."
    />
  );
}
