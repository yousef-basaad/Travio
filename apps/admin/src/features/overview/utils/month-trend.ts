export interface Trend {
  value: string;
  direction: "up" | "down";
}

// This month against last month as a whole-percent trend. Undefined when
// last month was zero or below (a percentage of nothing means nothing)
// or nothing changed - never a made-up trend. Same rule as the
// dashboard's trendFrom().
export function monthTrend(current: number, previous: number): Trend | undefined {
  if (previous <= 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return undefined;
  return { value: `${Math.abs(change)}%`, direction: change > 0 ? "up" : "down" };
}
