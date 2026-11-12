"use client";

import { Compass } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<Compass size={20} />}
            title={t("notFound.title")}
            description={t("notFound.description")}
            action={
              <Button asChild>
                <a href="/">{t("notFound.home")}</a>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
