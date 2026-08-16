import type { Database } from "@travio/database";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
type TenantUpdateRow = Database["public"]["Tables"]["tenants"]["Update"];

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  crNumber: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// name/crNumber are intentionally absent - Agency Settings (Product-4)
// only lets an owner edit contact info, never the legal name/CR number
// create_agency() already set at signup, same "some fields are
// write-once via a privileged path" reasoning profiles.role follows.
export interface UpdateTenantInput {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    crNumber: row.cr_number,
    phone: row.phone,
    email: row.email,
    address: row.address,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTenantUpdate(input: UpdateTenantInput): TenantUpdateRow {
  return {
    phone: input.phone,
    email: input.email,
    address: input.address,
  };
}
