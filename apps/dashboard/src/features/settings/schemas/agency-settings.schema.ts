import { z } from "zod";

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// name/slug/crNumber are deliberately absent - see tenantService's
// UpdateTenantInput comment for why those stay read-only here (set once,
// via create_agency() at signup).
export const agencySettingsFormSchema = z.object({
  phone: z.preprocess(emptyToNull, z.string().nullable()),
  email: z.preprocess(emptyToNull, z.string().email("Enter a valid email").nullable()),
  address: z.preprocess(emptyToNull, z.string().nullable()),
});

export type AgencySettingsFormValues = z.infer<typeof agencySettingsFormSchema>;
