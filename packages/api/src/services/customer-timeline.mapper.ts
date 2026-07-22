import type { Customer } from "./customer.mapper";
import type { CrmLead } from "./crm-leads.mapper";

export type CustomerTimelineItemType = "customer_created" | "lead_converted";

export interface CustomerTimelineItem {
  id: string;
  type: CustomerTimelineItemType;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// This layer never touches a generated Row type directly - it only maps
// already-mapped domain objects (Customer/CrmLead, produced by their own
// services) into the unified timeline shape, same approach as
// crm-timeline.mapper.ts.

export function customerToTimelineItem(customer: Customer): CustomerTimelineItem {
  return {
    id: `customer_created:${customer.id}`,
    type: "customer_created",
    title: `Customer created: ${customer.fullName}`,
    createdAt: customer.createdAt,
    metadata: { customerId: customer.id },
  };
}

// Only ever called with a lead that genuinely converted into this
// customer (lead.convertedCustomerId === customer.id, verified by the
// caller) - never fabricated or guessed. If convertedAt is somehow
// missing (shouldn't happen given convert_crm_lead() always sets it),
// there's nothing honest to sort by, so the event is omitted rather than
// backdated with a fabricated timestamp.
export function leadConversionToTimelineItem(lead: CrmLead): CustomerTimelineItem | null {
  if (!lead.convertedAt) return null;

  return {
    id: `lead_converted:${lead.id}`,
    type: "lead_converted",
    title: `Converted from lead: ${lead.fullName}`,
    createdAt: lead.convertedAt,
    metadata: { leadId: lead.id, convertedBy: lead.convertedBy, source: lead.source },
  };
}
