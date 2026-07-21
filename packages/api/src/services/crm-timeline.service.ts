import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { crmLeadsService } from "./crm-leads.service";
import { crmNotesService } from "./crm-notes.service";
import { crmActivitiesService } from "./crm-activities.service";
import {
  leadToTimelineItem,
  noteToTimelineItem,
  activityToTimelineItem,
  type CrmTimelineItem,
} from "./crm-timeline.mapper";

// Read-only composition over the three existing CRM services - no new
// table and no queries beyond what crmLeadsService/crmNotesService/
// crmActivitiesService already run. Tenant isolation is inherited
// entirely from those services' own RLS-backed queries (each already
// runs against the caller's tenant-scoped SupabaseClient); this layer
// adds no additional scoping of its own because none is needed.
export const crmTimelineService = {
  async listByLead(
    supabase: SupabaseClient<Database>,
    leadId: string,
  ): Promise<CrmTimelineItem[]> {
    const [lead, notes, activities] = await Promise.all([
      crmLeadsService.getById(supabase, leadId),
      crmNotesService.listByLead(supabase, leadId),
      crmActivitiesService.listByLead(supabase, leadId),
    ]);

    const items: CrmTimelineItem[] = [];

    if (lead) {
      const leadItem = leadToTimelineItem(lead);
      if (leadItem) items.push(leadItem);
    }

    for (const note of notes) {
      items.push(noteToTimelineItem(note));
    }

    for (const activity of activities) {
      const activityItem = activityToTimelineItem(activity);
      if (activityItem) items.push(activityItem);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items;
  },
};
