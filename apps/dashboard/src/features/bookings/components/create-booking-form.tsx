"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, FormField, Input, Select, Textarea } from "@travio/ui";
import { useCustomers } from "@/features/customers";
import { useCreateBooking } from "../api/bookings.api";
import {
  createBookingFormSchema,
  type CreateBookingFormValues,
} from "../schemas/create-booking.schema";
import { useT } from "@/lib/i18n/i18n-provider";
import { isMessageKey } from "@/lib/i18n/translate";
import { BookingTripFields } from "./booking-trip-fields";
import { PlanLimitError } from "@/lib/api/plan-limit-error";

const DEFAULT_VALUES: CreateBookingFormValues = {
  customerId: "",
  title: "",
  startDate: undefined,
  endDate: undefined,
  notes: undefined,
  destinationCountry: undefined,
  destinationCity: undefined,
  adults: undefined,
  children: undefined,
};

// Full-page form rather than a <dialog> (unlike CreateLeadDialog) - this
// issue explicitly asks for a dedicated /bookings/new route, not a modal
// launched from the list. Uses the design system's shared FormField/
// Input/Select/Textarea (packages/ui) instead of raw elements - the
// aria-invalid/aria-describedby wiring from react-hook-form's errors
// still lives here since FormField only owns the label+control+error
// shell, not validation state.
export function CreateBookingForm() {
  const router = useRouter();
  const createBooking = useCreateBooking();
  // Reuses the customers feature's own query - never a second/duplicate
  // customer fetch, per this issue's explicit instruction.
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const t = useT();
  // Schema errors are message keys; anything else is shown as-is.
  const fieldError = (message?: string) => (message && isMessageKey(message) ? t(message) : message);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const booking = await createBooking.mutateAsync(values);
      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      setSubmitError(t(error instanceof PlanLimitError ? error.messageKey : "bookings.createError"));
    }
  });

  return (
    <div className="max-w-lg space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/bookings">{t("bookings.back")}</Link>
      </Button>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">{t("bookings.new")}</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField label={t("common.customer")} htmlFor="booking-customer" error={fieldError(errors.customerId?.message)}>
              <Select
                id="booking-customer"
                aria-invalid={errors.customerId ? "true" : "false"}
                aria-describedby={errors.customerId ? "booking-customer-error" : undefined}
                disabled={isLoadingCustomers}
                {...register("customerId")}
              >
                <option value="">
                  {isLoadingCustomers ? t("common.loadingCustomers") : t("common.selectCustomer")}
                </option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t("bookingField.title")} htmlFor="booking-title" error={fieldError(errors.title?.message)}>
              <Input
                id="booking-title"
                aria-invalid={errors.title ? "true" : "false"}
                aria-describedby={errors.title ? "booking-title-error" : undefined}
                {...register("title")}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t("bookings.field.startDate")} htmlFor="booking-start-date" error={fieldError(errors.startDate?.message)}>
                <Input
                  id="booking-start-date"
                  type="date"
                  aria-invalid={errors.startDate ? "true" : "false"}
                  aria-describedby={errors.startDate ? "booking-start-date-error" : undefined}
                  {...register("startDate")}
                />
              </FormField>

              <FormField label={t("bookings.field.endDate")} htmlFor="booking-end-date" error={fieldError(errors.endDate?.message)}>
                <Input
                  id="booking-end-date"
                  type="date"
                  aria-invalid={errors.endDate ? "true" : "false"}
                  aria-describedby={errors.endDate ? "booking-end-date-error" : undefined}
                  {...register("endDate")}
                />
              </FormField>
            </div>

            <BookingTripFields register={register} errors={errors} idPrefix="booking" />

            <FormField label={t("common.notes")} htmlFor="booking-notes">
              <Textarea id="booking-notes" rows={4} {...register("notes")} />
            </FormField>

            {submitError && (
              <p role="alert" className="text-sm text-danger">
                {submitError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/bookings")}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.creating") : t("bookings.createSubmit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
