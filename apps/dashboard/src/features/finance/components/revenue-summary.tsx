import { RevenueOverview } from "@/features/analytics";

// Directly reuses the Analytics feature's RevenueOverview (same
// useRevenueOverview() hook, same Table+bar rendering) rather than
// re-implementing an equivalent "12 months of invoiced vs. paid" view -
// there's only one revenue-by-month component in the app, exposed here
// under the Finance workspace's own naming for composition in
// FinancePage.
export function RevenueSummary() {
  return <RevenueOverview />;
}
