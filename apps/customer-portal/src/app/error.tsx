"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[customer-portal] page error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertTriangle size={20} />}
            title="Something went wrong"
            description="This page couldn't be loaded. Please try again."
            action={<Button onClick={reset}>Try again</Button>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
