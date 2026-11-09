import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable();

export const saveBrandingSchema = z.object({
  tagline: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((value) => value || null),
  primaryColor: color,
  sidebarColor: color,
});
