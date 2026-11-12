"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[customer-portal] page error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertTriangle size={20} />}
            title={t("error.title")}
            description={t("error.description")}
            action={<Button onClick={reset}>{t("error.retry")}</Button>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
