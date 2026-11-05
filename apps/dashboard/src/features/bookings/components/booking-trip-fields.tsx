"use client";

import { useEffect, useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField, Input, Select } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { isMessageKey } from "@/lib/i18n/translate";
import { countryOptions } from "@/lib/countries/countries";

// The trip fields shared by the create and edit booking forms: where the
// trip goes (country code + city) and how many travel.
export interface BookingTripFieldValues {
  destinationCountry?: string | null;
  destinationCity?: string | null;
  adults?: number | null;
  children?: number | null;
}

export function BookingTripFields<T extends BookingTripFieldValues>({
  register,
  errors,
  idPrefix,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  idPrefix: string;
}) {
  const { t, locale } = useI18n();
  // Built in the browser after the first render: Node and the browser
  // ship different ICU data, so country names (and their order) could
  // differ between the server HTML and the client and break hydration.
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    setCountries(countryOptions(intlLocale(locale)));
  }, [locale]);
  // Schema errors are message keys; anything else is shown as-is.
  const fieldError = (message?: unknown) =>
    typeof message === "string" ? (isMessageKey(message) ? t(message) : message) : undefined;
  // Same field names on every form using this component.
  const reg = register as unknown as UseFormRegister<BookingTripFieldValues>;
  const err = errors as FieldErrors<BookingTripFieldValues>;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t("bookings.field.destinationCountry")}
          htmlFor={`${idPrefix}-country`}
          error={fieldError(err.destinationCountry?.message)}
        >
          <Select id={`${idPrefix}-country`} {...reg("destinationCountry")}>
            <option value="">{t("bookings.field.selectCountry")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label={t("bookings.field.destinationCity")}
          htmlFor={`${idPrefix}-city`}
          error={fieldError(err.destinationCity?.message)}
        >
          <Input id={`${idPrefix}-city`} maxLength={120} {...reg("destinationCity")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t("bookings.field.adults")} htmlFor={`${idPrefix}-adults`} error={fieldError(err.adults?.message)}>
          <Input id={`${idPrefix}-adults`} type="number" inputMode="numeric" min={0} max={999} {...reg("adults")} />
        </FormField>
        <FormField
          label={t("bookings.field.children")}
          htmlFor={`${idPrefix}-children`}
          error={fieldError(err.children?.message)}
        >
          <Input id={`${idPrefix}-children`} type="number" inputMode="numeric" min={0} max={999} {...reg("children")} />
        </FormField>
      </div>
    </>
  );
}
