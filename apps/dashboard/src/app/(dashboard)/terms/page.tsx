import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms & Conditions"
      description="Terms of service for the Travio platform"
      icon={<FileText size={20} />}
      emptyTitle="Terms & Conditions coming soon"
      emptyDescription="This page's content hasn't been published yet."
    />
  );
}
