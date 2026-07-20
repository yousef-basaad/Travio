import { z } from "zod";

// A tenant = one travel agency using Travio.
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2),
  crNumber: z.string().min(5).describe("Saudi Commercial Registration number"),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

export type Tenant = z.infer<typeof tenantSchema>;
