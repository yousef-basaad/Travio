export interface Trend {
  value: string;
  direction: "up" | "down";
}

// The last value against the one before it, as a whole-percent trend.
// Undefined when there is no previous value, it was zero or negative (a
// percentage of a zero/negative base means nothing - e.g. a net loss),
// or nothing changed - never a made-up trend.
export function trendFrom(series: number[]): Trend | undefined {
  if (series.length < 2) return undefined;
  const current = series[series.length - 1] ?? 0;
  const previous = series[series.length - 2] ?? 0;
  if (previous <= 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return undefined;
  return { value: `${Math.abs(change)}%`, direction: change > 0 ? "up" : "down" };
}
