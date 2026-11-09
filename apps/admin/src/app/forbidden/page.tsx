"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardContent, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// Rendered by (admin)/layout.tsx's requireRole() gate when a real session
// exists but the account isn't travio_admin (or requireRole() failed).
// Distinct from /login, which is only for "no session at all". No "back"
// action: a forbidden account has nowhere in this app to go back to.
export default function ForbiddenPage() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState icon={<ShieldAlert size={20} />} title={t("forbidden.title")} description={t("forbidden.description")} />
        </CardContent>
      </Card>
    </div>
  );
}
