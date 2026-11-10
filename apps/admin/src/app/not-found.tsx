import { Compass } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<Compass size={20} />}
            title={translate(locale, "errorPage.notFoundTitle")}
            description={translate(locale, "errorPage.notFoundDescription")}
            action={
              <Button asChild>
                <a href="/">{translate(locale, "errorPage.home")}</a>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
