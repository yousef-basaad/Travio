"use client";

import { Select } from "@travio/ui";
import { useUpdateTeamMemberRole, type AssignableRole, type TeamMemberResponse } from "../api/team.api";
import { TEAM_ROLE_LABELS } from "./team-role-badge";

const ASSIGNABLE_ROLE_OPTIONS: AssignableRole[] = [
  "sales_agent",
  "branch_manager",
  "visa_officer",
  "accountant",
];

export function isAssignableRole(role: string): role is AssignableRole {
  return (ASSIGNABLE_ROLE_OPTIONS as readonly string[]).includes(role);
}

// Mirrors bookings' ChangeBookingStatus: a plain <Select> that changes
// the value on select, backed by update_team_member_role() (which itself
// re-checks the caller is agency_owner and the new role is one of the
// four assignable ones - see this phase's migration). Only rendered for
// a member whose CURRENT role is already one of those four - the owner's
// own row has no control here at all (see TeamTable), so there's no
// "demote yourself" affordance to guard against client-side.
export function ChangeTeamMemberRole({ member }: { member: TeamMemberResponse }) {
  const updateRole = useUpdateTeamMemberRole();

  if (!isAssignableRole(member.role)) {
    return null;
  }

  return (
    <Select
      aria-label={`Change role for ${member.fullName}`}
      className="h-8 w-auto text-xs"
      value={member.role}
      disabled={updateRole.isPending}
      onChange={(event) => {
        const role = event.target.value as AssignableRole;
        if (role !== member.role) {
          updateRole.mutate({ id: member.id, role });
        }
      }}
    >
      {ASSIGNABLE_ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {TEAM_ROLE_LABELS[role]}
        </option>
      ))}
    </Select>
  );
}
