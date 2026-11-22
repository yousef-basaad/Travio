"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n/i18n-provider";

export interface TeamDirectoryEntry {
  id: string;
  fullName: string | null;
}

async function fetchTeamDirectory(): Promise<TeamDirectoryEntry[]> {
  const response = await fetch("/api/team/directory");
  if (!response.ok) throw new Error(`Failed to load team directory (${response.status})`);
  return (await response.json()) as TeamDirectoryEntry[];
}

export function useTeamDirectory() {
  return useQuery({
    queryKey: ["team", "directory"],
    queryFn: fetchTeamDirectory,
    // Names rarely change; one load per session is plenty.
    staleTime: 5 * 60 * 1000,
  });
}

// Turns an assignee id into the staff member's name for display:
// "Unassigned" for none, "…" while the names load, and "Former team
// member" for an id that isn't on the agency's staff any more (never the
// raw id).
export function useStaffName(): (userId: string | null | undefined) => string {
  const t = useT();
  const { data, isLoading } = useTeamDirectory();

  return useCallback(
    (userId) => {
      if (!userId) return t("common.unassigned");
      const member = data?.find((entry) => entry.id === userId);
      if (member) return member.fullName?.trim() || t("common.unnamedMember");
      return isLoading ? "…" : t("common.formerMember");
    },
    [data, isLoading, t],
  );
}
