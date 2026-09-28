"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@travio/ui";
import { useInviteTeamMember, type AssignableRole } from "../api/team.api";
import { TEAM_ROLE_LABELS } from "./team-role-badge";

const ASSIGNABLE_ROLE_OPTIONS: AssignableRole[] = [
  "sales_agent",
  "branch_manager",
  "visa_officer",
  "accountant",
];

const EMPTY_FORM = {
  email: "",
  fullName: "",
  role: "sales_agent" as AssignableRole,
};

export interface InviteTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. Submitting sends a real
// Supabase Auth invite email (POST /api/team -> auth.admin.
// inviteUserByEmail) - there is no draft/preview step, matching every
// other create dialog's "submit now" convention in this app.
export function InviteTeamMemberDialog({ open, onOpenChange }: InviteTeamMemberDialogProps) {
  const inviteTeamMember = useInviteTeamMember();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setValidationError(null);
      inviteTeamMember.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const email = form.email.trim();
    const fullName = form.fullName.trim();

    if (!email) {
      setValidationError("Email is required.");
      return;
    }
    if (!fullName) {
      setValidationError("Name is required.");
      return;
    }
    setValidationError(null);

    inviteTeamMember.mutate(
      { email, fullName, role: form.role },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // inviteTeamMember.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={inviteTeamMember.isPending}
      aria-labelledby="invite-team-member-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="invite-team-member-title" className="text-lg font-semibold">
          Invite Team Member
        </h2>

        <FormField label="Full Name" htmlFor="invite-full-name" error={validationError ?? undefined}>
          <Input
            id="invite-full-name"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </FormField>

        <FormField label="Email" htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </FormField>

        <FormField label="Role" htmlFor="invite-role">
          <Select
            id="invite-role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as AssignableRole })}
          >
            {ASSIGNABLE_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {TEAM_ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </FormField>

        {inviteTeamMember.isError && (
          <p role="alert" className="text-sm text-danger">
            {inviteTeamMember.error instanceof Error
              ? inviteTeamMember.error.message
              : "Couldn't send the invite. Please try again."}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={inviteTeamMember.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={inviteTeamMember.isPending}>
            {inviteTeamMember.isPending ? "Sending…" : "Send Invite"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
