"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@travio/utils";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { setLocale } from "@/lib/i18n/set-locale";

// Saves the other language in the cookie, then re-renders from the
// server so <html lang dir> and every translated string update. The
// label is the other language's own name ("العربية" / "English").
export function LanguageSwitch({ className, onSwitched }: { className?: string; onSwitched?: () => void }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isSwitching, startSwitch] = useTransition();

  return (
    <button
      type="button"
      lang={locale === "ar" ? "en" : "ar"}
      aria-label={t("nav.switchLanguage")}
      disabled={isSwitching}
      onClick={() =>
        startSwitch(async () => {
          await setLocale(locale === "ar" ? "en" : "ar");
          router.refresh();
          onSwitched?.();
        })
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground disabled:opacity-60",
        className,
      )}
    >
      <Languages size={16} aria-hidden="true" />
      {t("nav.otherLanguage")}
    </button>
  );
}
