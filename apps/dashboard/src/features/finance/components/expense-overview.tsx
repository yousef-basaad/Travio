"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Wallet } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  FormField,
  Input,
  Textarea,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { formatCurrency, formatDate } from "@travio/utils";
import { useExpenses, useCreateExpense } from "../api/expenses.api";

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "",
  expenseDate: "",
  description: "",
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup, same convention as every
// other create dialog in this app. category is a plain nullable text
// column with no enum/CHECK constraint (confirmed in the finance_system
// migration), so it's a free-text Input, not a fabricated fixed list of
// categories.
function CreateExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createExpense = useCreateExpense();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setValidationError(null);
      createExpense.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedTitle = form.title.trim();
    if (trimmedTitle.length === 0) {
      setValidationError("Title is required.");
      return;
    }

    const trimmedAmount = form.amount.trim();
    const parsedAmount = trimmedAmount === "" ? Number.NaN : Number(trimmedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Enter a valid expense amount.");
      return;
    }

    setValidationError(null);

    createExpense.mutate(
      {
        title: trimmedTitle,
        amount: parsedAmount,
        category: form.category.trim() || undefined,
        expenseDate: form.expenseDate || undefined,
        description: form.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createExpense.isPending}
      aria-labelledby="create-expense-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-expense-title" className="text-lg font-semibold">
          Add Expense
        </h2>

        <FormField label="Title" htmlFor="expense-title" error={validationError ?? undefined}>
          <Input
            id="expense-title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Amount" htmlFor="expense-amount">
            <Input
              id="expense-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </FormField>

          <FormField label="Category" htmlFor="expense-category">
            <Input
              id="expense-category"
              placeholder="e.g. Office, Marketing"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </FormField>

          <FormField label="Date" htmlFor="expense-date">
            <Input
              id="expense-date"
              type="date"
              value={form.expenseDate}
              onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="expense-description">
          <Textarea
            id="expense-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </FormField>

        {createExpense.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the expense. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createExpense.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? "Adding…" : "Add Expense"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ExpenseOverview() {
  const { data: expenses, isLoading, isError } = useExpenses();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Expenses</h2>
          <p className="text-xs text-muted-foreground">Operating costs logged for your agency</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Expense
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!expenses || expenses.length === 0}
          loadingLabel="Loading expenses"
          errorMessage="Something went wrong loading expenses. Please try again later."
          emptyMessage="No expenses logged yet"
          emptyIcon={<Wallet size={20} />}
          emptyAction={
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Add Expense
            </Button>
          }
        >
          <Table aria-label="Expenses" caption="All logged expenses, most recent first">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>Title</TableCell>
                <TableCell header>Category</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(expenses ?? []).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell>{expense.category ?? "—"}</TableCell>
                  <TableCell>{expense.expenseDate ? formatDate(expense.expenseDate) : "—"}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
      </CardContent>

      <CreateExpenseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Card>
  );
}
