"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading agency profile" className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function SettingsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      Something went wrong loading your agency profile. Please try again later.
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
    resolver: zodResolver(agencySettingsFormSchema),
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
      setSubmitError("Couldn't save your changes. Please try again.");
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your agency's profile and contact information" />

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError || !tenant ? (
        <SettingsErrorState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Agency Details</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Agency Name" value={tenant.name} />
                <InfoRow label="CR Number" value={tenant.crNumber} />
                <InfoRow label="Slug" value={tenant.slug} />
                <InfoRow label="Status" value={tenant.isActive ? "Active" : "Inactive"} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Contact Information</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Phone" htmlFor="agency-phone" error={errors.phone?.message}>
                    <Input id="agency-phone" {...register("phone")} />
                  </FormField>

                  <FormField label="Email" htmlFor="agency-email" error={errors.email?.message}>
                    <Input id="agency-email" type="email" {...register("email")} />
                  </FormField>
                </div>

                <FormField label="Address" htmlFor="agency-address" error={errors.address?.message}>
                  <Input id="agency-address" {...register("address")} />
                </FormField>

                {submitError && (
                  <p role="alert" className="text-sm text-danger">
                    {submitError}
                  </p>
                )}
                {saved && !submitError && (
                  <p className="text-sm text-success">Saved.</p>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save Changes"}
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
