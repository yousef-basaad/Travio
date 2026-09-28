"use client";

import { Users } from "lucide-react";
import { Widget, DataTableState, Avatar } from "@travio/ui";
import { useTeamMembers } from "@/features/team";
import { useBookings } from "@/features/bookings";

// Design System v2.5 (Product-8.2 Phase 3): the reference's "Team"
// widget - real booking counts per team member, computed client-side by
// cross-referencing each booking's own `assignedTo` (the sales-ownership
// field Product-4's ownership model already added) against the team
// roster (useTeamMembers, the same hook the Team page uses). No new
// endpoint: both lists are already fully fetched elsewhere in this app,
// this just joins them. The bar width is each member's count relative
// to the busiest member's count (a real, computed proportion) - never a
// fabricated quota/target, since no such thing exists in this app.
export function TeamActivity() {
  const { data: members, isLoading: isLoadingMembers, isError: isErrorMembers } = useTeamMembers();
  const { data: bookings, isLoading: isLoadingBookings, isError: isErrorBookings } = useBookings();

  const isLoading = isLoadingMembers || isLoadingBookings;
  // A failed request (e.g. /api/team's server_misconfigured 500) shows an
  // error state, never a misleading "No team members yet".
  const isError = isErrorMembers || isErrorBookings;

  const countByMember = new Map<string, number>();
  for (const booking of bookings ?? []) {
    if (!booking.assignedTo) continue;
    countByMember.set(booking.assignedTo, (countByMember.get(booking.assignedTo) ?? 0) + 1);
  }

  const rows = (members ?? [])
    .map((member) => ({ member, count: countByMember.get(member.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Widget title="Team" description="Bookings assigned per team member">
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Couldn't load team activity."
        isEmpty={rows.length === 0}
        emptyMessage="No team members yet"
        emptyIcon={<Users size={20} />}
      >
        <ul className="space-y-3">
          {rows.map(({ member, count }) => (
            <li key={member.id} className="flex items-center gap-3">
              <Avatar name={member.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-foreground">{member.fullName}</span>
                  <span className="shrink-0 text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    aria-hidden="true"
                    className="h-1.5 rounded-full bg-primary transition-all duration-slow ease-default"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </DataTableState>
    </Widget>
  );
}
