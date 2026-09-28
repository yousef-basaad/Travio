import type { Database } from "@travio/database";

type VisaApplicationRow = Database["public"]["Tables"]["visa_applications"]["Row"];
type VisaApplicationInsertRow = Database["public"]["Tables"]["visa_applications"]["Insert"];
type VisaApplicationUpdateRow = Database["public"]["Tables"]["visa_applications"]["Update"];

// status is a real Postgres enum (visa_status: draft/submitted/approved/
// rejected) - unlike booking_flights' cabin_class/booking_hotels'
// board_type/booking_transfers' transfer_type (all plain text + CHECK),
// the generated Row type already gives an exact literal union, no
// runtime guard needed.
export type VisaStatus = Database["public"]["Enums"]["visa_status"];

export interface VisaApplication {
  id: string;
  // tenant_id remains nullable at the DB level (out of scope for this
  // issue) - kept honestly nullable here rather than asserted, though in
  // practice RLS never surfaces a null-tenant row to any caller.
  tenantId: string | null;
  customerId: string;
  bookingId: string | null;
  assignedTo: string | null;
  country: string | null;
  visaType: string | null;
  status: VisaStatus | null;
  submittedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateVisaApplicationInput {
  tenantId: string;
  customerId: string;
  bookingId?: string | null;
  assignedTo?: string | null;
  country?: string | null;
  visaType?: string | null;
  status?: VisaStatus;
  submittedAt?: string | null;
  createdBy?: string | null;
}

export interface UpdateVisaApplicationInput {
  bookingId?: string | null;
  assignedTo?: string | null;
  country?: string | null;
  visaType?: string | null;
  status?: VisaStatus;
  submittedAt?: string | null;
}

export function toVisaApplication(row: VisaApplicationRow): VisaApplication {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    bookingId: row.booking_id,
    assignedTo: row.assigned_to,
    country: row.country,
    visaType: row.visa_type,
    status: row.status,
    submittedAt: row.submitted_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toVisaApplicationInsert(
  input: CreateVisaApplicationInput,
): VisaApplicationInsertRow {
  return {
    tenant_id: input.tenantId,
    customer_id: input.customerId,
    booking_id: input.bookingId ?? null,
    assigned_to: input.assignedTo ?? null,
    country: input.country ?? null,
    visa_type: input.visaType ?? null,
    status: input.status,
    submitted_at: input.submittedAt ?? null,
    created_by: input.createdBy ?? null,
  };
}

export function toVisaApplicationUpdate(
  input: UpdateVisaApplicationInput,
): VisaApplicationUpdateRow {
  return {
    booking_id: input.bookingId,
    assigned_to: input.assignedTo,
    country: input.country,
    visa_type: input.visaType,
    status: input.status,
    submitted_at: input.submittedAt,
  };
}
