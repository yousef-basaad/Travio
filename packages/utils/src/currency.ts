// SAR-aware currency formatting. Centralized because financial figures
// (bookings, invoices, refunds) must render identically across all apps.
export function formatSar(amount: number, locale: "ar-SA" | "en-US" = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(amount);
}
