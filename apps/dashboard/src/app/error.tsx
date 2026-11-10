"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// Shown when a page crashes. The error itself stays out of the page; its
// details are in the browser console and the server logs.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    console.error("[dashboard] page error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertTriangle size={20} />}
            title={t("errorPage.title")}
            description={t("errorPage.description")}
            action={<Button onClick={reset}>{t("errorPage.retry")}</Button>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
