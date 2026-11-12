"use client";

import { useT } from "@/lib/i18n/i18n-provider";

// Visa status lives on each booking (see TripServices); this page only
// points there. It isn't linked from the header.
export function VisaView() {
  const t = useT();
  return <div className="text-muted-foreground">{t("visa.page")}</div>;
}
