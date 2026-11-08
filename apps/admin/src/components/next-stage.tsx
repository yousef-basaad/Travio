"use client";

import { Hammer } from "lucide-react";
import { Card, CardContent, EmptyState, PageHeader } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// A section of the console that isn't built yet - says so plainly
// instead of showing empty tables or invented numbers.
export function NextStage({ titleKey }: { titleKey: MessageKey }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <Card>
        <CardContent className="pt-6">
          <EmptyState icon={<Hammer size={20} />} title={t("placeholder.title")} description={t("placeholder.description")} />
        </CardContent>
      </Card>
    </div>
  );
}
