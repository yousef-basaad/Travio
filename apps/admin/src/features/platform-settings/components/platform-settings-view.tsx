"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Button, Card, Dialog, PageHeader } from "@travio/ui";
import type { PlatformPlan } from "@travio/api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { updatePlan } from "../api/update-plan";
import { PLAN_LIMIT_KEYS, parsePlanForm, type PlanLimitKey } from "../utils/plan-form";

const UNLIMITED = "unlimited";

const PLAN_KEYS: Record<string, MessageKey> = {
  starter: "overview.plan.starter",
  business: "overview.plan.business",
  enterprise: "overview.plan.enterprise",
};

const LIMIT_LABELS: Record<PlanLimitKey, MessageKey> = {
  max_users: "settings.limit.max_users",
  max_bookings_monthly: "settings.limit.max_bookings_monthly",
  max_documents: "settings.limit.max_documents",
  max_storage_mb: "settings.limit.max_storage_mb",
};

function initialLimits(plan: PlatformPlan): Record<PlanLimitKey, string> {
  return Object.fromEntries(PLAN_LIMIT_KEYS.map((key) => [key, plan.limits[key] ?? ""])) as Record<PlanLimitKey, string>;
}

function PlanCard({ plan }: { plan: PlatformPlan }) {
  const { t, format } = useI18n();
  const router = useRouter();
  const [price, setPrice] = useState(String(plan.price));
  const [limits, setLimits] = useState(() => initialLimits(plan));
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<"saved" | "invalid" | "failed" | null>(null);
  const [isSaving, startSaving] = useTransition();
  const name = PLAN_KEYS[plan.slug] ? t(PLAN_KEYS[plan.slug]!) : plan.name;

  const setLimit = (key: PlanLimitKey, value: string) => {
    setMessage(null);
    setLimits((current) => ({ ...current, [key]: value }));
  };

  const askToSave = () => {
    if (!parsePlanForm(price, limits)) {
      setMessage("invalid");
      return;
    }
    setMessage(null);
    setConfirming(true);
  };

  const save = () =>
    startSaving(async () => {
      const { ok } = await updatePlan(plan.id, price, limits);
      setConfirming(false);
      setMessage(ok ? "saved" : "failed");
      if (ok) router.refresh();
    });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">{name}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.agencies", { count: format.number(plan.agencies) })}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {t(plan.billingInterval === "yearly" ? "settings.yearly" : "settings.monthly")}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <label htmlFor={`price-${plan.id}`} className="text-xs font-medium text-muted-foreground">
            {t("settings.price")}
          </label>
          <input
            id={`price-${plan.id}`}
            dir="ltr"
            inputMode="decimal"
            value={price}
            onChange={(event) => {
              setMessage(null);
              setPrice(event.target.value);
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {Number(price) === 0 ? <p className="text-xs text-muted-foreground">{t("settings.customPriceHint")}</p> : null}
        </div>

        {PLAN_LIMIT_KEYS.map((key) => {
          const unlimited = limits[key] === UNLIMITED;
          return (
            <div key={key} className="space-y-1">
              <label htmlFor={`${key}-${plan.id}`} className="text-xs font-medium text-muted-foreground">
                {t(LIMIT_LABELS[key])}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id={`${key}-${plan.id}`}
                  dir="ltr"
                  inputMode="numeric"
                  disabled={unlimited}
                  value={unlimited ? "" : limits[key]}
                  onChange={(event) => setLimit(key, event.target.value)}
                  className="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm disabled:bg-muted"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={(event) => setLimit(key, event.target.checked ? UNLIMITED : (plan.limits[key] !== UNLIMITED && plan.limits[key]) || "")}
                  />
                  {t("settings.unlimited")}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {message ? (
        <p role={message === "saved" ? "status" : "alert"} className={`mt-3 text-sm ${message === "saved" ? "text-success" : "text-danger"}`}>
          {t(message === "saved" ? "settings.saved" : message === "invalid" ? "settings.invalid" : "settings.saveError")}
        </p>
      ) : null}

      <Button className="mt-4 w-full" onClick={askToSave} disabled={isSaving}>
        {t("settings.save")}
      </Button>

      {confirming ? (
        <Dialog open preventClose={isSaving} onOpenChange={(open) => !open && setConfirming(false)} className="w-full max-w-md p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">{t("settings.confirm.title", { name })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.confirm.body", { count: format.number(plan.agencies) })}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={isSaving}>
              {t("agencies.confirm.cancel")}
            </Button>
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? t("agencies.confirm.working") : t("settings.save")}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </Card>
  );
}

// The platform-wide settings that exist today: each plan's price and
// usage limits.
export function PlatformSettingsView({ plans }: { plans: PlatformPlan[] }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.settings")} description={t("settings.description")} />
      <p className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 p-3 text-sm text-foreground">
        <Info size={16} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
        {t("settings.websiteNotice")}
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
