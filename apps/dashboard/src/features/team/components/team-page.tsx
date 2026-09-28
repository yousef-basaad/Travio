"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import {
  Button,
  PageHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { cn, formatDate } from "@travio/utils";
import { useTeamMembers, type TeamMemberResponse } from "../api/team.api";
import { InviteTeamMemberDialog } from "./invite-team-member-dialog";
import { ChangeTeamMemberRole, isAssignableRole } from "./change-team-member-role";
import { TeamRoleBadge } from "./team-role-badge";

const COLUMNS = ["Name", "Email", "Role", "Status", "Member Since"];

const STATUS_LABELS: Record<TeamMemberResponse["status"], string> = {
  active: "Active",
  pending: "Invite Pending",
};

const STATUS_STYLES: Record<TeamMemberResponse["status"], string> = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
};

// Full page composition, mirroring BookingsTable/CustomersTable's own
// shape - PageHeader + action, then a DataTableState-wrapped Table. No
// search/filter here (unlike those two) - a team roster is small enough
// (single digits to dozens) that one isn't needed yet, same reasoning
// CustomerOverviewTab's small lists skip it.
export function TeamPage() {
  const { data: members, isLoading, isError } = useTeamMembers();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="The people in your agency and the roles they hold"
        actions={<Button onClick={() => setIsInviteOpen(true)}>Invite Member</Button>}
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!members || members.length === 0)}
        loadingLabel="Loading team members"
        errorMessage="Something went wrong loading your team. Please try again later."
        emptyMessage="No team members yet"
        emptyIcon={<Users size={20} />}
        emptyAction={<Button onClick={() => setIsInviteOpen(true)}>Invite Member</Button>}
        size="page"
      >
        <Table aria-label="Team members" caption="Everyone in your agency">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(members ?? []).map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium text-foreground">{member.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  {/* Owner's own row (and any future travio_admin row) has
                      no editable control - only the four assignable roles
                      can be changed here, matching update_team_member_
                      role()'s own server-side restriction. */}
                  {isAssignableRole(member.role) ? (
                    <ChangeTeamMemberRole member={member} />
                  ) : (
                    <TeamRoleBadge role={member.role} />
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[member.status],
                    )}
                  >
                    {STATUS_LABELS[member.status]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      <InviteTeamMemberDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
