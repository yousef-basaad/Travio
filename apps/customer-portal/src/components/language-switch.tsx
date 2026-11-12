"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { setLocale } from "@/lib/i18n/set-locale";

// Switches between Arabic and English. The label is the other language's
// own name, so it's readable whichever one is showing now.
export function LanguageSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      lang={locale === "ar" ? "en" : "ar"}
      aria-label={t("header.switchLanguageLabel")}
      onClick={() =>
        startTransition(async () => {
          await setLocale(locale === "ar" ? "en" : "ar");
          router.refresh();
        })
      }
    >
      {t("header.switchLanguage")}
    </Button>
  );
}
