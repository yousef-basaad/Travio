import type { VisaStatus } from "@travio/api";

// Share of decided applications that were approved, as a whole percent.
// Null when nothing has been decided yet (no 0% that looks like a
// failure).
export function approvalRate(byStatus: Record<VisaStatus, number>): number | null {
  const decided = byStatus.approved + byStatus.rejected;
  if (decided === 0) return null;
  return Math.round((byStatus.approved / decided) * 100);
}
