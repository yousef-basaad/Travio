import Link from "next/link";
import { Stamp } from "lucide-react";
import { Button, PageHeader, EmptyState } from "@travio/ui";

// Phase UI-6: replaces the previous one-line stub. There is no
// tenant-wide "all visa applications" capability today - visa
// applications are only ever fetched scoped to a single customer
// (visaApplicationsService.listByCustomer(), surfaced via each
// Customer 360's "Visa Applications" tab - see features/customers/
// components/visa/). Building a tenant-wide list would need a new
// service method and API route, which is out of this phase's scope
// ("visual/UI changes only... do not create features that don't
// exist"). This is an honest, professionally-designed empty state
// pointing at where visa applications actually live today, not a
// fabricated list.
export default function VisaPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Visa Applications"
        description="Visa applications are managed from each customer's profile"
      />
      <EmptyState
        icon={<Stamp size={20} />}
        title="No tenant-wide visa view yet"
        description="Visa applications are tracked per customer - open a customer's profile and use the Visa Applications tab to view, add, or update their applications."
        action={
          <Button asChild>
            <Link href="/customers">Go to Customers</Link>
          </Button>
        }
      />
    </div>
  );
}
