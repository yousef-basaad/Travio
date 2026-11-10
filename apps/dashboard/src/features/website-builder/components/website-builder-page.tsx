"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, PageHeader, SkeletonCard } from "@travio/ui";
import { AGENCY_SERVICES, type AgencyService, type AgencySiteContent, type AgencySiteEditor } from "@travio/api/agency-site";
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

function Editor({ slug, initial }: { slug: string; initial: AgencySiteContent }) {
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
      {data ? <Editor slug={data.slug} initial={data.site} /> : null}
    </div>
  );
}
