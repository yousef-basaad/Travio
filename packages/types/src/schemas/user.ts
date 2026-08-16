import { z } from "zod";


// Roles govern access across dashboard/admin/customer-portal.
export const userRoleSchema = z.enum([
  "travio_admin",     // Travio staff
  "agency_owner",     // Agency owner
  "branch_manager",   // Branch manager
  "sales_agent",      // Sales staff
  "visa_officer",     // Visa department
  "accountant",       // Finance staff
  "customer",         // End customer
]);


export type UserRole = z.infer<typeof userRoleSchema>;


export const profileSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  // Product-5: links a 'customer'-role profile to the CRM record an
  // agent already created for them (public.customers) - null for every
  // staff profile, and null for a customer-role profile that hasn't
  // been invited to the portal yet. Never set together with a non-null
  // tenantId - see the customer-portal identity migration's own
  // comment for why customer profiles stay tenant-less by design.
  customerId: z.string().uuid().nullable(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: userRoleSchema,
});


export type Profile = z.infer<typeof profileSchema>;