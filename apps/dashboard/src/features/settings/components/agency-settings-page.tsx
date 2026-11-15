"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formResolver } from "@/lib/forms/form-resolver";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormField,
  Input,
  InfoRow,
  PageHeader,
  Skeleton,
} from "@travio/ui";
import { useTenant, useUpdateTenant } from "../api/tenant.api";
import {
  agencySettingsFormSchema,
  type AgencySettingsFormValues,
} from "../schemas/agency-settings.schema";
import { useT } from "@/lib/i18n/i18n-provider";

function SettingsSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("settings.loading")} className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function SettingsErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      {t("settings.error")}
    </div>
  );
}

// Replaces the previous one-line placeholder (app/(dashboard)/settings/
// page.tsx). Two sections: a read-only "Agency Details" card (name/slug/
// CR number - set once at signup via create_agency(), never editable
// here, same reasoning tenantService's UpdateTenantInput documents) and
// an editable "Contact Information" form (phone/email/address, the
// fields this phase's migration actually added).
export function AgencySettingsPage() {
  const t = useT();
  const { data: tenant, isLoading, isError } = useTenant();
  const updateTenant = useUpdateTenant();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgencySettingsFormValues>({
    resolver: formResolver(agencySettingsFormSchema),
    defaultValues: { phone: null, email: null, address: null },
  });

  useEffect(() => {
    if (tenant) {
      reset({ phone: tenant.phone, email: tenant.email, address: tenant.address });
    }
  }, [tenant, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSaved(false);
    try {
      await updateTenant.mutateAsync(values);
      setSaved(true);
    } catch {
      setSubmitError(t("common.saveError"));
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.settings")} description={t("settings.description")} />

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError || !tenant ? (
        <SettingsErrorState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">{t("settings.details")}</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label={t("settings.agencyName")} value={tenant.name} />
                <InfoRow label={t("settings.crNumber")} value={tenant.crNumber} />
                <InfoRow label={t("settings.slug")} value={tenant.slug} />
                <InfoRow label={t("common.status")} value={tenant.isActive ? t("common.active") : t("common.inactive")} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">{t("settings.contact")}</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t("field.phone")} htmlFor="agency-phone" error={errors.phone?.message}>
                    <Input id="agency-phone" type="tel" {...register("phone")} />
                  </FormField>

                  <FormField label={t("field.email")} htmlFor="agency-email" error={errors.email?.message}>
                    <Input id="agency-email" type="email" {...register("email")} />
                  </FormField>
                </div>

                <FormField label={t("settings.address")} htmlFor="agency-address" error={errors.address?.message}>
                  <Input id="agency-address" {...register("address")} />
                </FormField>

                {submitError && (
                  <p role="alert" className="text-sm text-danger">
                    {submitError}
                  </p>
                )}
                {saved && !submitError && (
                  <p className="text-sm text-success">{t("settings.saved")}</p>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("common.saving") : t("common.saveChanges")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
