import type { Database } from "@travio/database";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsertRow = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdateRow = Database["public"]["Tables"]["customers"]["Update"];

export interface Customer {
  id: string;
  tenantId: string;
  branchId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  dateOfBirth: string | null;
  preferredLanguage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCustomerInput {
  tenantId: string;
  fullName: string;
  branchId?: string | null;
  phone?: string | null;
  email?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  dateOfBirth?: string | null;
  preferredLanguage?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  branchId?: string | null;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  dateOfBirth?: string | null;
  preferredLanguage?: string | null;
  notes?: string | null;
}

// Unlike crm-activities.mapper.ts, every customers column is already
// precisely typed by the generated Row (no untyped text-as-enum column
// like crm_activities.type), so there's no loosely-typed value here that
// needs a runtime guard to safely narrow - straightforward field mapping
// is the "no blind casts" outcome, not an omission.

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    nationality: row.nationality,
    passportNumber: row.passport_number,
    passportExpiry: row.passport_expiry,
    dateOfBirth: row.date_of_birth,
    preferredLanguage: row.preferred_language,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function toCustomerInsert(input: CreateCustomerInput): CustomerInsertRow {
  return {
    tenant_id: input.tenantId,
    full_name: input.fullName,
    branch_id: input.branchId,
    phone: input.phone,
    email: input.email,
    nationality: input.nationality,
    passport_number: input.passportNumber,
    passport_expiry: input.passportExpiry,
    date_of_birth: input.dateOfBirth,
    preferred_language: input.preferredLanguage,
    notes: input.notes,
  };
}

export function toCustomerUpdate(input: UpdateCustomerInput): CustomerUpdateRow {
  return {
    branch_id: input.branchId,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    nationality: input.nationality,
    passport_number: input.passportNumber,
    passport_expiry: input.passportExpiry,
    date_of_birth: input.dateOfBirth,
    preferred_language: input.preferredLanguage,
    notes: input.notes,
  };
}
