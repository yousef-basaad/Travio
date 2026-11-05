"use client";

import { MapPin } from "lucide-react";
import { BarList, Card, CardContent, CardHeader, DataTableState } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { countryName } from "@/lib/countries/countries";
import { useTopDestinations } from "../api/analytics.api";

// The destination countries with the most live bookings
// (analytics_top_destinations). Countries come from each booking's
// destination, so bookings without one aren't counted.
export function TopDestinations() {
  const { t, locale } = useI18n();
  const { data: destinations, isLoading, isError } = useTopDestinations();
  const tag = intlLocale(locale);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("analytics.destinations.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("analytics.destinations.description")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          errorMessage={t("analytics.destinations.error")}
          isEmpty={(destinations ?? []).length === 0}
          emptyMessage={t("analytics.destinations.empty")}
          emptyIcon={<MapPin size={20} />}
        >
          <BarList
            rows={(destinations ?? []).map((destination) => ({
              label: countryName(destination.country, tag),
              value: destination.bookings,
              barClassName: "bg-primary",
            }))}
          />
        </DataTableState>
      </CardContent>
    </Card>
  );
}
