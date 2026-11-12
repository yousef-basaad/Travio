"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, PageHeader, SkeletonCard } from "@travio/ui";
import { AGENCY_SERVICES, SITE_TEMPLATES, type AgencyService, type AgencySiteContent, type AgencySiteEditor, type SiteTemplate } from "@travio/api/agency-site";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const QUERY_KEY = ["website-builder"];

const SERVICE_KEYS: Record<AgencyService, MessageKey> = {
  flights: "websiteBuilder.service.flights",
  hotels: "websiteBuilder.service.hotels",
  visas: "websiteBuilder.service.visas",
  packages: "websiteBuilder.service.packages",
  transfers: "websiteBuilder.service.transfers",
  insurance: "websiteBuilder.service.insurance",
};

async function read(response: Response): Promise<AgencySiteEditor> {
  if (!response.ok) throw new Error(`website builder request failed (${response.status})`);
  return (await response.json()) as AgencySiteEditor;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function siteUrl(slug: string): string | null {
  const base = process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "");
  return base ? `${base}/sites/${encodeURIComponent(slug)}` : null;
}

const TEMPLATE_KEYS: Record<SiteTemplate, MessageKey> = {
  classic: "websiteBuilder.template.classic",
  split: "websiteBuilder.template.split",
  minimal: "websiteBuilder.template.minimal",
};

// A small sketch of each layout, so the choice is visual.
function TemplateSketch({ template }: { template: SiteTemplate }) {
  if (template === "split") {
    return (
      <div className="flex h-16 items-center gap-2 p-2" aria-hidden="true">
        <div className="flex-1 space-y-1">
          <div className="h-1.5 rounded bg-foreground/60" />
          <div className="h-1.5 w-2/3 rounded bg-foreground/30" />
        </div>
        <div className="h-full flex-1 rounded bg-primary" />
      </div>
    );
  }
  if (template === "minimal") {
    return (
      <div className="flex h-16 flex-col items-center justify-center gap-1 p-2" aria-hidden="true">
        <div className="h-1.5 w-2/3 rounded bg-foreground/60" />
        <div className="h-1.5 w-1/3 rounded bg-foreground/30" />
      </div>
    );
  }
  return (
    <div className="flex h-16 flex-col items-center justify-center gap-1 bg-primary p-2" aria-hidden="true">
      <div className="h-1.5 w-2/3 rounded bg-primary-foreground/80" />
      <div className="h-1.5 w-1/3 rounded bg-primary-foreground/50" />
    </div>
  );
}

const HERO_ERRORS: Record<string, MessageKey> = {
  too_large: "websiteBuilder.hero.tooLarge",
  invalid_image: "websiteBuilder.hero.invalid",
};

function HeroCard({ heroUrl }: { heroUrl: string | null }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  const change = useMutation({
    mutationFn: async (file: File | null) => {
      const form = new FormData();
      if (file) form.append("file", file);
      const response = await fetch("/api/website-builder/hero", file ? { method: "POST", body: form } : { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "failed");
      }
      return (await response.json()) as AgencySiteEditor;
    },
    onMutate: () => setError(null),
    onSuccess: (editor) => queryClient.setQueryData(QUERY_KEY, editor),
    onError: (failure) => setError(HERO_ERRORS[failure.message] ?? "websiteBuilder.hero.error"),
  });

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) change.mutate(file);
  };

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">{t("websiteBuilder.hero.title")}</h2>
      <p className="text-xs text-muted-foreground">{t("websiteBuilder.hero.hint")}</p>
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {heroUrl ? (
          <img src={heroUrl} alt={t("websiteBuilder.hero.title")} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={24} className="text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex gap-2">
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={t("websiteBuilder.hero.change")} onChange={onFile} />
        <Button variant="outline" disabled={change.isPending} onClick={() => fileInput.current?.click()}>
          {change.isPending ? t("websiteBuilder.saving") : t("websiteBuilder.hero.change")}
        </Button>
        {heroUrl ? (
          <Button variant="ghost" disabled={change.isPending} aria-label={t("websiteBuilder.hero.remove")} onClick={() => change.mutate(null)}>
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {t(error)}
        </p>
      ) : null}
    </Card>
  );
}

function Editor({ slug, initial, heroUrl }: { slug: string; initial: AgencySiteContent; heroUrl: string | null }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [site, setSite] = useState(initial);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; key: MessageKey } | null>(null);
  const url = siteUrl(slug);

  const save = useMutation({
    mutationFn: async (next: AgencySiteContent) =>
      read(
        await fetch("/api/website-builder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }),
      ),
    onSuccess: (editor) => {
      queryClient.setQueryData(QUERY_KEY, editor);
      setSite(editor.site);
    },
  });

  const update = <K extends keyof AgencySiteContent>(key: K, value: AgencySiteContent[K]) => {
    setMessage(null);
    setSite((current) => ({ ...current, [key]: value }));
  };
  const text = (key: "headline" | "subheadline" | "about" | "city" | "phone" | "whatsapp" | "email") => ({
    value: site[key] ?? "",
    onChange: (event: { target: { value: string } }) => update(key, event.target.value),
  });

  const persist = (next: AgencySiteContent, successKey: MessageKey) => {
    if (next.isPublished && !next.headline?.trim()) {
      setMessage({ tone: "danger", key: "websiteBuilder.needsHeadline" });
      return;
    }
    save.mutate(next, {
      onSuccess: () => setMessage({ tone: "success", key: successKey }),
      onError: () => setMessage({ tone: "danger", key: "websiteBuilder.saveError" }),
    });
  };

  const toggleService = (service: AgencyService, on: boolean) =>
    update("services", on ? AGENCY_SERVICES.filter((item) => item === service || site.services.includes(item)) : site.services.filter((item) => item !== service));

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className={`h-2 w-2 rounded-full ${site.isPublished ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />
            {t(site.isPublished ? "websiteBuilder.published" : "websiteBuilder.draft")}
          </p>
          {url && site.isPublished ? (
            <a href={url} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              {url}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t("websiteBuilder.draftHint")}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={() => persist(site, "websiteBuilder.saved")}>
            {save.isPending ? t("websiteBuilder.saving") : t("websiteBuilder.save")}
          </Button>
          {site.isPublished ? (
            <Button variant="destructive" disabled={save.isPending} onClick={() => persist({ ...site, isPublished: false }, "websiteBuilder.unpublishedDone")}>
              {t("websiteBuilder.unpublish")}
            </Button>
          ) : (
            <Button disabled={save.isPending} onClick={() => persist({ ...site, isPublished: true }, "websiteBuilder.publishedDone")}>
              {t("websiteBuilder.publish")}
            </Button>
          )}
        </div>
        {message ? (
          <p role={message.tone === "success" ? "status" : "alert"} className={`w-full text-sm ${message.tone === "success" ? "text-success" : "text-danger"}`}>
            {t(message.key)}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("websiteBuilder.template.title")}</h2>
          <div role="radiogroup" aria-label={t("websiteBuilder.template.title")} className="grid grid-cols-3 gap-3">
            {SITE_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                role="radio"
                aria-checked={site.template === template}
                onClick={() => update("template", template)}
                className={`overflow-hidden rounded-lg border-2 text-xs font-medium transition-colors ${
                  site.template === template ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                <TemplateSketch template={template} />
                <span className="block border-t py-1.5">{t(TEMPLATE_KEYS[template])}</span>
              </button>
            ))}
          </div>
        </Card>

        <HeroCard heroUrl={heroUrl} />

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("websiteBuilder.section.main")}</h2>
          <Field label={t("websiteBuilder.language")}>
            <select className={inputClass} value={site.language} onChange={(event) => update("language", event.target.value as AgencySiteContent["language"])}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label={t("websiteBuilder.headline")}>
            <input className={inputClass} maxLength={120} {...text("headline")} />
          </Field>
          <Field label={t("websiteBuilder.subheadline")}>
            <input className={inputClass} maxLength={240} {...text("subheadline")} />
          </Field>
          <Field label={t("websiteBuilder.about")}>
            <textarea className={inputClass} rows={5} maxLength={1500} {...text("about")} />
          </Field>
          <Toggle label={t("websiteBuilder.showAbout")} checked={site.showAbout} onChange={(value) => update("showAbout", value)} />
        </Card>

        <div className="space-y-5">
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t("websiteBuilder.section.services")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {AGENCY_SERVICES.map((service) => (
                <Toggle key={service} label={t(SERVICE_KEYS[service])} checked={site.services.includes(service)} onChange={(on) => toggleService(service, on)} />
              ))}
            </div>
            <div className="border-t pt-3">
              <Toggle label={t("websiteBuilder.showServices")} checked={site.showServices} onChange={(value) => update("showServices", value)} />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t("websiteBuilder.section.contact")}</h2>
            <p className="text-xs text-muted-foreground">{t("websiteBuilder.contactPublic")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("websiteBuilder.whatsapp")}>
                <input dir="ltr" inputMode="tel" className={inputClass} maxLength={32} {...text("whatsapp")} />
              </Field>
              <Field label={t("websiteBuilder.phone")}>
                <input dir="ltr" inputMode="tel" className={inputClass} maxLength={32} {...text("phone")} />
              </Field>
              <Field label={t("websiteBuilder.email")}>
                <input dir="ltr" type="email" className={inputClass} maxLength={254} {...text("email")} />
              </Field>
              <Field label={t("websiteBuilder.city")}>
                <input className={inputClass} maxLength={80} {...text("city")} />
              </Field>
            </div>
            <Toggle label={t("websiteBuilder.showContact")} checked={site.showContact} onChange={(value) => update("showContact", value)} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// Website Builder, first stage: the content of the agency's public page,
// with publish and unpublish. Logo and color come from Brand Studio.
export function WebsiteBuilderPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => read(await fetch("/api/website-builder")),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.websiteBuilder")} description={t("websiteBuilder.description")} />
      {isLoading ? <SkeletonCard /> : null}
      {isError ? (
        <p role="alert" className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {t("websiteBuilder.loadError")}
        </p>
      ) : null}
      {data ? <Editor slug={data.slug} initial={data.site} heroUrl={data.heroUrl} /> : null}
    </div>
  );
}
