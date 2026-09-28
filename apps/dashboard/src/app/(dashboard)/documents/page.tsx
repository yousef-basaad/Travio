import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@travio/ui";
import { ComingSoon } from "@/components/coming-soon";

// No tenant-wide "all documents" capability exists yet - documents are
// only ever fetched scoped to a single customer or booking
// (documentService.list({ ownerType, ownerId })), surfaced via each
// Customer 360/Booking 360's own Documents tab. Same reasoning as the
// existing Visa Center page (Phase UI-6) - an honest pointer at where
// documents actually live today, not a fabricated cross-tenant list.
export default function DocumentsPage() {
  return (
    <ComingSoon
      title="Documents"
      description="Passports, visas, vouchers, and other attached files"
      icon={<FileText size={20} />}
      emptyTitle="No workspace-wide document view yet"
      emptyDescription="Documents are tracked per customer or booking - open a customer's or booking's profile and use its Documents tab to view or upload files."
      action={
        <Button asChild>
          <Link href="/customers">Go to Customers</Link>
        </Button>
      }
    />
  );
}
