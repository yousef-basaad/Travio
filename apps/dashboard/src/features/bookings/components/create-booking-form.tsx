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

const DEFAULT_VALUES: CreateBookingFormValues = {
  customerId: "",
  title: "",
  startDate: undefined,
  endDate: undefined,
  notes: undefined,
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
    } catch {
      setSubmitError("Couldn't create the booking. Please try again.");
    }
  });

  return (
    <div className="max-w-lg space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/bookings">← Back to Bookings</Link>
      </Button>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">New Booking</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField label="Customer" htmlFor="booking-customer" error={errors.customerId?.message}>
              <Select
                id="booking-customer"
                aria-invalid={errors.customerId ? "true" : "false"}
                aria-describedby={errors.customerId ? "booking-customer-error" : undefined}
                disabled={isLoadingCustomers}
                {...register("customerId")}
              >
                <option value="">
                  {isLoadingCustomers ? "Loading customers…" : "Select a customer"}
                </option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Title" htmlFor="booking-title" error={errors.title?.message}>
              <Input
                id="booking-title"
                aria-invalid={errors.title ? "true" : "false"}
                aria-describedby={errors.title ? "booking-title-error" : undefined}
                {...register("title")}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Start Date" htmlFor="booking-start-date" error={errors.startDate?.message}>
                <Input
                  id="booking-start-date"
                  type="date"
                  aria-invalid={errors.startDate ? "true" : "false"}
                  aria-describedby={errors.startDate ? "booking-start-date-error" : undefined}
                  {...register("startDate")}
                />
              </FormField>

              <FormField label="End Date" htmlFor="booking-end-date" error={errors.endDate?.message}>
                <Input
                  id="booking-end-date"
                  type="date"
                  aria-invalid={errors.endDate ? "true" : "false"}
                  aria-describedby={errors.endDate ? "booking-end-date-error" : undefined}
                  {...register("endDate")}
                />
              </FormField>
            </div>

            <FormField label="Notes" htmlFor="booking-notes">
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
