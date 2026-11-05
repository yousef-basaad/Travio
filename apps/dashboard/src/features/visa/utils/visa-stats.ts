import type { VisaStatus } from "@travio/api";

// Share of decided applications that were approved, as a whole percent.
// Null when nothing has been decided yet (no 0% that looks like a
// failure).
export function approvalRate(byStatus: Record<VisaStatus, number>): number | null {
  const decided = byStatus.approved + byStatus.rejected;
  if (decided === 0) return null;
  return Math.round((byStatus.approved / decided) * 100);
}

// New applications this month vs last month as a trend. Undefined when
// last month had none (no divide-by-zero percentage) or nothing changed.
export function monthTrend(
  thisMonth: number,
  lastMonth: number,
): { value: string; direction: "up" | "down" } | undefined {
  if (lastMonth === 0) return undefined;
  const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  if (change === 0) return undefined;
  return { value: `${Math.abs(change)}%`, direction: change > 0 ? "up" : "down" };
}
