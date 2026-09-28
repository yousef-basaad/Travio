"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, toast } from "@travio/ui";
import {
  CreateCustomerValidationError,
  useCreateCustomer,
  type CreateCustomerFieldErrors,
} from "../api/customers.api";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  passportExpiry: "",
  preferredLanguage: "",
};

type CreateCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Same shape as CreateVisaDialog: the shared Dialog owns the modal
// mechanics, this owns form state and fields. The API's 400 issues are
// shown next to their fields (see toCreateCustomerErrors); on any
// failure the dialog stays open with the entered values intact.
export function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
  const createCustomer = useCreateCustomer();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<CreateCustomerFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setFormError(null);
      createCustomer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const fullName = form.fullName.trim();
    if (!fullName) {
      setFieldErrors({ fullName: "Full name is required" });
      return;
    }
    setFieldErrors({});

    createCustomer.mutate(
      {
        fullName,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        passportExpiry: form.passportExpiry || undefined,
        preferredLanguage: form.preferredLanguage.trim() || undefined,
      },
      {
        onSuccess: (customer) => {
          toast({
            variant: "success",
            title: "Customer created",
            description: `${customer.fullName} was added to your customers.`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          if (error instanceof CreateCustomerValidationError) {
            setFieldErrors(error.fieldErrors);
            setFormError(error.formError);
          } else {
            setFormError("Couldn't create the customer. Please try again.");
          }
        },
      },
    );
  };

  const fieldProps = (field: keyof typeof EMPTY_FORM, id: string) => ({
    id,
    value: form[field],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: event.target.value }),
    invalid: Boolean(fieldErrors[field]),
    "aria-invalid": Boolean(fieldErrors[field]),
    "aria-describedby": fieldErrors[field] ? `${id}-error` : undefined,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createCustomer.isPending}
      aria-labelledby="create-customer-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-customer-title" className="text-lg font-semibold">
          New Customer
        </h2>

        <FormField label="Full Name" htmlFor="customer-full-name" error={fieldErrors.fullName}>
          <Input {...fieldProps("fullName", "customer-full-name")} autoComplete="off" required />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="customer-phone" error={fieldErrors.phone}>
            <Input {...fieldProps("phone", "customer-phone")} type="tel" autoComplete="off" />
          </FormField>

          <FormField label="Email" htmlFor="customer-email" error={fieldErrors.email}>
            <Input {...fieldProps("email", "customer-email")} type="email" autoComplete="off" />
          </FormField>

          <FormField
            label="Passport Expiry"
            htmlFor="customer-passport-expiry"
            error={fieldErrors.passportExpiry}
          >
            <Input {...fieldProps("passportExpiry", "customer-passport-expiry")} type="date" />
          </FormField>

          <FormField
            label="Preferred Language"
            htmlFor="customer-preferred-language"
            error={fieldErrors.preferredLanguage}
          >
            <Input {...fieldProps("preferredLanguage", "customer-preferred-language")} autoComplete="off" />
          </FormField>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCustomer.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createCustomer.isPending}>
            {createCustomer.isPending ? "Creating…" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
