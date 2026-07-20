// Per-tenant white-label theme (logo, colors) applied via CSS variables.
// Follow the pattern established in features/customers and features/bookings:
// components/ (UI), api/ (queries/mutations), schemas/ (Zod), types/ (local types).
export function BrandingPlaceholder() {
  return <div className="text-muted-foreground">Branding - implement following features/bookings pattern.</div>;
}
