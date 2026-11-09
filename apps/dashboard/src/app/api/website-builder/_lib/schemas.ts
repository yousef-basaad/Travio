import { z } from "zod";
import { AGENCY_SERVICES } from "@travio/api";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);

const phone = z
  .string()
  .trim()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => value === null || /^\+?[0-9 ()-]{6,32}$/.test(value));

const email = z
  .string()
  .trim()
  .max(254)
  .nullable()
  .transform((value) => value || null)
  .refine((value) => value === null || z.string().email().safeParse(value).success);

// The same limits as the agency_sites column checks, so a bad value gets
// a clean 400 instead of a database error.
export const saveSiteSchema = z
  .object({
    isPublished: z.boolean(),
    language: z.enum(["ar", "en"]),
    headline: optionalText(120),
    subheadline: optionalText(240),
    about: optionalText(1500),
    city: optionalText(80),
    phone,
    whatsapp: phone,
    email,
    services: z.array(z.enum(AGENCY_SERVICES)).max(AGENCY_SERVICES.length),
    showServices: z.boolean(),
    showAbout: z.boolean(),
    showContact: z.boolean(),
  })
  .refine((site) => !site.isPublished || site.headline !== null, { path: ["headline"] });
