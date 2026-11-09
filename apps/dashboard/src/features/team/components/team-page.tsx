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
import { cn } from "@travio/utils";
import { useTeamMembers, type TeamMemberResponse } from "../api/team.api";
import { InviteTeamMemberDialog } from "./invite-team-member-dialog";
import { ChangeTeamMemberRole, isAssignableRole } from "./change-team-member-role";
import { TeamRoleBadge } from "./team-role-badge";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const COLUMNS: MessageKey[] = ["common.name", "field.email", "common.role", "common.status", "team.memberSince"];

const STATUS_KEYS: Record<TeamMemberResponse["status"], MessageKey> = {
  active: "common.active",
  pending: "team.invitePending",
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
  const t = useT();
  const format = useFormat();
  const { data: members, isLoading, isError } = useTeamMembers();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.team")}
        description={t("team.description")}
        actions={<Button onClick={() => setIsInviteOpen(true)}>{t("team.invite")}</Button>}
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!members || members.length === 0)}
        loadingLabel={t("team.loading")}
        errorMessage={t("team.error")}
        emptyMessage={t("home.team.empty")}
        emptyIcon={<Users size={20} />}
        emptyAction={<Button onClick={() => setIsInviteOpen(true)}>{t("team.invite")}</Button>}
        size="page"
      >
        <Table aria-label={t("team.tableLabel")} caption={t("team.tableCaption")}>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {t(column)}
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
                    {t(STATUS_KEYS[member.status])}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{format.date(member.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      <InviteTeamMemberDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
