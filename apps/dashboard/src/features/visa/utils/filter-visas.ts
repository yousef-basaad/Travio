import type { VisaApplicationWithCustomer, VisaStatus } from "@travio/api";

export type VisaStatusFilter = VisaStatus | "all";

// Client-side search + status filter over the already-loaded list, same
// convention as the Customers/Leads tables. Search matches the
// customer's name, country and visa type, case-insensitively.
export function filterVisaApplications(
  visas: VisaApplicationWithCustomer[],
  { query, status }: { query: string; status: VisaStatusFilter },
): VisaApplicationWithCustomer[] {
  const needle = query.trim().toLowerCase();

  return visas.filter((visa) => {
    if (status !== "all" && visa.status !== status) return false;
    if (!needle) return true;
    const haystack = `${visa.customer?.fullName ?? ""} ${visa.country ?? ""} ${visa.visaType ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
}
