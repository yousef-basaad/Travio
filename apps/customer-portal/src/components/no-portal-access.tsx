"use client";

import { UserX } from "lucide-react";
import { Card, CardContent, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// Shown for an authenticated "customer"-role session with no linked
// customer_id - either a public self-signup that was never invited, or
// an invite that hasn't completed yet. Never a crash/blank page: this is
// a real, expected state the identity model documents explicitly (see
// the Product-5 migration's own comment on handle_new_user's default
// branch).
export function NoPortalAccess() {
  const t = useT();
  return (
    <Card>
      <CardContent className="pt-6">
        <EmptyState
          icon={<UserX size={20} />}
          title={t("noAccess.title")}
          description={t("noAccess.description")}
        />
      </CardContent>
    </Card>
  );
}
