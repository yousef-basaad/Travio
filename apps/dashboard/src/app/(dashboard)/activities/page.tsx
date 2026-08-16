import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@travio/ui";
import { ComingSoon } from "@/components/coming-soon";

// No cross-entity activity feed exists - activity timelines today are
// scoped per lead (crm-timeline) or per customer (customer-timeline),
// not aggregated into one workspace-wide feed. Honest pointer at where
// activity is actually tracked today, same pattern as Documents/Visa.
export default function ActivitiesPage() {
  return (
    <ComingSoon
      title="Activities"
      description="Recent activity across your agency"
      icon={<Activity size={20} />}
      emptyTitle="No workspace-wide activity feed yet"
      emptyDescription="Activity is tracked per lead and per customer today - open a lead or customer's profile and use its Activity tab to see its own timeline."
      action={
        <Button asChild>
          <Link href="/leads">Go to Leads</Link>
        </Button>
      }
    />
  );
}
