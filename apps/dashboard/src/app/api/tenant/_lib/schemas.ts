import { z } from "zod";

// Digits, spaces and + ( ) - . only: a phone number, not free text.
const PHONE_PATTERN = /^[0-9+()\-.\s]{3,32}$/;

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// name/slug/crNumber/isActive are intentionally absent - Agency Settings
// only lets an owner edit contact info (see tenantService's own
// UpdateTenantInput comment for why the rest stays read-only here).
export const updateTenantSchema = z.object({
  phone: z.preprocess(emptyToNull, z.string().max(32).regex(PHONE_PATTERN, "validation.invalidPhone").nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().max(254).email().nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
}).refine((input) => Object.values(input).some((value) => value !== undefined), {
  message: "nothing_to_update",
});
