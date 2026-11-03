"use client";

import { useT } from "@/lib/i18n/i18n-provider";

// "from → to" that reads correctly in both directions: each end is
// isolated (<bdi>), so a Latin airport code or an Arabic city keeps its
// own order, and the arrow points along the reading direction (→ in
// English, ← in Arabic).
export function RouteText({ from, to }: { from: string; to: string }) {
  const t = useT();
  return (
    <>
      <bdi>{from}</bdi> {t("common.routeArrow")} <bdi>{to}</bdi>
    </>
  );
}
