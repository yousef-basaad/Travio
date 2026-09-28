"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@travio/types";

export const TEAM_QUERY_KEY = ["team"];

// Mirrors app/api/team/_lib/schemas.ts's TeamMemberResponse shape -
// declared here rather than imported, since Next.js route files may
// only export recognized handler functions/route config, never
// arbitrary types.
export interface TeamMemberResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: "active" | "pending";
  createdAt: string;
}

async function fetchTeamMembers(): Promise<TeamMemberResponse[]> {
  const response = await fetch("/api/team");

  if (!response.ok) {
    throw new Error(`Failed to load team members (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/team");
  }

  return data as TeamMemberResponse[];
}

export function useTeamMembers() {
  return useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: fetchTeamMembers,
  });
}

export type AssignableRole = "sales_agent" | "branch_manager" | "visa_officer" | "accountant";

async function inviteTeamMember(input: {
  email: string;
  fullName: string;
  role: AssignableRole;
}): Promise<TeamMemberResponse> {
  const response = await fetch("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Failed to invite team member (${response.status})`;
    throw new Error(message);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/team");
  }

  return data as TeamMemberResponse;
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
    },
  });
}

async function updateTeamMemberRole({
  id,
  role,
}: {
  id: string;
  role: AssignableRole;
}): Promise<TeamMemberResponse> {
  const response = await fetch(`/api/team/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Failed to update role (${response.status})`;
    throw new Error(message);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/team/:id");
  }

  return data as TeamMemberResponse;
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTeamMemberRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
    },
  });
}
