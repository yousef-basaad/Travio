"use client";

import { useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, ImagePlus, Trash2, TrendingUp, Users } from "lucide-react";
import { Button, Card, PageHeader, SkeletonCard } from "@travio/ui";
import type { TenantBranding } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { DEFAULT_PRIMARY, DEFAULT_SIDEBAR, brandThemeVars, isHexColor } from "@travio/utils";
import { BrandingRequestError, useBranding, useRemoveLogo, useSaveBranding, useUploadLogo } from "../api/branding.api";

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHexColor(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-background p-1"
        />
        <input
          dir="ltr"
          value={value}
          maxLength={7}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} (hex)`}
          className="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// A small copy of the dashboard, drawn with the unsaved colors.
function Preview({ primary, sidebar, logoUrl, name, tagline }: { primary: string; sidebar: string; logoUrl: string | null; name: string; tagline: string }) {
  const { t } = useI18n();
  const style = brandThemeVars({ primaryColor: primary, sidebarColor: sidebar }) as CSSProperties;
  const tiles = [
    { label: t("branding.preview.bookings"), value: "124", icon: <CalendarCheck2 size={16} /> },
    { label: t("branding.preview.customers"), value: "86", icon: <Users size={16} /> },
    { label: t("branding.preview.sales"), value: "12%", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div style={style} className="flex min-h-80 overflow-hidden rounded-lg border" aria-hidden="true">
      <div className="w-36 shrink-0 space-y-2 bg-sidebar p-3 text-sidebar-foreground">
        <div className="flex items-center gap-2 pb-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-7 w-7 rounded object-contain" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">T</span>
          )}
          <span className="truncate text-xs font-semibold">{name}</span>
        </div>
        <div className="rounded-md bg-sidebar-active px-2 py-1.5 text-xs text-sidebar-active-foreground">{t("branding.preview.nav1")}</div>
        <div className="rounded-md px-2 py-1.5 text-xs opacity-80">{t("branding.preview.nav2")}</div>
        <div className="rounded-md bg-sidebar-hover px-2 py-1.5 text-xs">{t("branding.preview.nav3")}</div>
      </div>
      <div className="min-w-0 flex-1 space-y-3 bg-background p-4">
        <div>
          <p className="truncate text-sm font-bold text-foreground">{t("branding.preview.welcome", { name })}</p>
          {tagline ? <p className="truncate text-xs text-muted-foreground">{tagline}</p> : null}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-md border p-2">
              <span className="text-primary">{tile.icon}</span>
              <p className="mt-1 text-sm font-bold text-foreground">{tile.value}</p>
              <p className="truncate text-[10px] text-muted-foreground">{tile.label}</p>
            </div>
          ))}
        </div>
        <span className="inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{t("branding.preview.button")}</span>
      </div>
    </div>
  );
}

const LOGO_ERRORS: Record<string, MessageKey> = {
  too_large: "branding.logo.tooLarge",
  invalid_image: "branding.logo.invalid",
};

function Studio({ branding }: { branding: TenantBranding }) {
  const { t } = useI18n();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [primary, setPrimary] = useState(branding.primaryColor ?? DEFAULT_PRIMARY);
  const [sidebar, setSidebar] = useState(branding.sidebarColor ?? DEFAULT_SIDEBAR);
  const [tagline, setTagline] = useState(branding.tagline ?? "");
  const [message, setMessage] = useState<{ tone: "success" | "danger"; key: MessageKey } | null>(null);
  const save = useSaveBranding();
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const isBusy = save.isPending || upload.isPending || remove.isPending;
  const colorsValid = isHexColor(primary) && isHexColor(sidebar);

  const done = (key: MessageKey) => {
    setMessage({ tone: "success", key });
    // The layout reads branding on the server, so the real theme follows.
    router.refresh();
  };

  const persist = (colors: { primary: string | null; sidebar: string | null }) =>
    save.mutate(
      { tagline, primaryColor: colors.primary, sidebarColor: colors.sidebar },
      { onSuccess: () => done("branding.saved"), onError: () => setMessage({ tone: "danger", key: "branding.saveError" }) },
    );

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => done("branding.logo.uploaded"),
      onError: (error) =>
        setMessage({
          tone: "danger",
          key: (error instanceof BrandingRequestError && LOGO_ERRORS[error.code]) || "branding.logo.error",
        }),
    });
  };

  const name = branding.agencyName ?? t("branding.preview.agency");

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("branding.logo.title")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("branding.logo.hint")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted/40">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={t("branding.logo.title")} className="max-h-20 max-w-20 object-contain" />
              ) : (
                <ImagePlus size={24} className="text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="flex gap-2">
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={t("branding.logo.change")} onChange={onFile} />
              <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={isBusy}>
                {upload.isPending ? t("branding.logo.uploading") : t("branding.logo.change")}
              </Button>
              {branding.logoUrl ? (
                <Button
                  variant="ghost"
                  disabled={isBusy}
                  aria-label={t("branding.logo.remove")}
                  onClick={() =>
                    remove.mutate(undefined, {
                      onSuccess: () => done("branding.logo.removed"),
                      onError: () => setMessage({ tone: "danger", key: "branding.logo.error" }),
                    })
                  }
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label htmlFor="brand-tagline" className="text-sm font-medium text-foreground">
              {t("branding.tagline")}
            </label>
            <input
              id="brand-tagline"
              value={tagline}
              maxLength={200}
              onChange={(event) => setTagline(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField label={t("branding.primary")} value={primary} onChange={setPrimary} />
            <ColorField label={t("branding.sidebar")} value={sidebar} onChange={setSidebar} />
          </div>
          {colorsValid ? null : <p className="text-sm text-danger">{t("branding.invalidColor")}</p>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={isBusy || !colorsValid} onClick={() => persist({ primary, sidebar })}>
              {save.isPending ? t("branding.saving") : t("branding.save")}
            </Button>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                setPrimary(DEFAULT_PRIMARY);
                setSidebar(DEFAULT_SIDEBAR);
                persist({ primary: null, sidebar: null });
              }}
            >
              {t("branding.reset")}
            </Button>
          </div>
          {message ? (
            <p role={message.tone === "success" ? "status" : "alert"} className={`text-sm ${message.tone === "success" ? "text-success" : "text-danger"}`}>
              {t(message.key)}
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="h-fit p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("branding.preview.title")}</h2>
        <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{t("branding.preview.hint")}</p>
        <Preview
          primary={isHexColor(primary) ? primary : DEFAULT_PRIMARY}
          sidebar={isHexColor(sidebar) ? sidebar : DEFAULT_SIDEBAR}
          logoUrl={branding.logoUrl}
          name={name}
          tagline={tagline}
        />
      </Card>
    </div>
  );
}

// Brand Studio from the TRAVIO design: the parts that take effect today
// (logo, tagline, primary and sidebar colors), with a live preview.
export function BrandStudioPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useBranding();

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.branding")} description={t("branding.description")} />
      {isLoading ? <SkeletonCard /> : null}
      {isError ? (
        <p role="alert" className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {t("branding.loadError")}
        </p>
      ) : null}
      {data ? <Studio branding={data} /> : null}
    </div>
  );
}
