import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { customerService } from "./customer.service";
import { crmLeadsService } from "./crm-leads.service";
import {
  customerToTimelineItem,
  leadConversionToTimelineItem,
  type CustomerTimelineItem,
} from "./customer-timeline.mapper";

// Read-only composition over existing services - no new table, no new
// service methods on customerService/crmLeadsService, no raw Supabase
// queries. Mirrors crm-timeline.service.ts's architecture exactly.
export const customerTimelineService = {
  async listByCustomer(
    supabase: SupabaseClient<Database>,
    customerId: string,
  ): Promise<CustomerTimelineItem[]> {
    const customer = await customerService.getById(supabase, customerId);
    if (!customer) return [];

    const items: CustomerTimelineItem[] = [customerToTimelineItem(customer)];

    // crmLeadsService has no "find lead by converted_customer_id" method,
    // and this is deliberately not added here - adding a new query/method
    // just for this lookup isn't "composing existing services". Instead
    // this reuses the existing list() method (tenant scope taken from the
    // customer we already fetched, not a new parameter or check) and
    // filters in-memory for the one real, already-existing relationship
    // (crm_leads.converted_customer_id). This is honest - the
    // relationship genuinely exists in the schema - just less efficient
    // than a dedicated query would be; a fine trade-off for this
    // foundation, worth revisiting if listByCustomer needs to scale.
    const leads = await crmLeadsService.list(supabase, customer.tenantId);
    const convertedLead = leads.find((lead) => lead.convertedCustomerId === customerId);

    if (convertedLead) {
      const conversionItem = leadConversionToTimelineItem(convertedLead);
      if (conversionItem) items.push(conversionItem);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items;
  },
};
