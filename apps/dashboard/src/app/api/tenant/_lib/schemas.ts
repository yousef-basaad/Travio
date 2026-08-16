import { z } from "zod";

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// name/slug/crNumber/isActive are intentionally absent - Agency Settings
// only lets an owner edit contact info (see tenantService's own
// UpdateTenantInput comment for why the rest stays read-only here).
export const updateTenantSchema = z.object({
  phone: z.preprocess(emptyToNull, z.string().nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().email().nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().nullable().optional()),
});
