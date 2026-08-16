// Generic currency formatting. SAR is the default since it's the
// currency every existing caller (bookings, invoices, payments,
// analytics) actually formats today.
export function formatCurrency(
  amount: number,
  currency: string = "SAR",
  locale: "ar-SA" | "en-US" = "en-US",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Backward-compatible alias - formatSar predates the design system's
// formal formatCurrency and every existing call site (bookings, invoices,
// payments, analytics) still uses this name. Kept as a thin wrapper so
// none of them need touching.
export function formatSar(amount: number, locale: "ar-SA" | "en-US" = "en-US") {
  return formatCurrency(amount, "SAR", locale);
}
