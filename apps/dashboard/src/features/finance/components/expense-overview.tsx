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
  SearchInput,
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { useExpensesPage, useCreateExpense } from "../api/expenses.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { FINANCE_CARD_PAGE_SIZE } from "./finance-paging";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

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
  const t = useT();
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
      setValidationError(t("finance.expenses.titleRequired"));
      return;
    }

    const trimmedAmount = form.amount.trim();
    const parsedAmount = trimmedAmount === "" ? Number.NaN : Number(trimmedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t("finance.expenses.invalidAmount"));
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
          {t("finance.expenses.add")}
        </h2>

        <FormField label={t("bookingField.title")} htmlFor="expense-title" error={validationError ?? undefined}>
          <Input
            id="expense-title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("bookingField.amount")} htmlFor="expense-amount">
            <Input
              id="expense-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </FormField>

          <FormField label={t("finance.expenses.category")} htmlFor="expense-category">
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

        <FormField label={t("finance.items.description")} htmlFor="expense-description">
          <Textarea
            id="expense-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </FormField>

        {createExpense.isError && (
          <p role="alert" className="text-sm text-danger">
            {t("finance.expenses.addError")}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createExpense.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? t("common.adding") : t("finance.expenses.add")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// Paged and searched (title/category) on the server, so it isn't capped
// at the 1000 rows one response can hold.
export function ExpenseOverview() {
  const t = useT();
  const format = useFormat();
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(undefined, FINANCE_CARD_PAGE_SIZE);
  const { data, isLoading, isError, isFetching } = useExpensesPage({ page, pageSize, search: debouncedSearch });
  const expenses = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("finance.expenses.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("finance.expenses.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          {t("finance.expenses.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SearchInput
          placeholder={t("finance.expenses.searchPlaceholder")}
          aria-label={t("finance.expenses.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && expenses.length === 0}
          loadingLabel={t("finance.expenses.loading")}
          errorMessage={t("finance.expenses.error")}
          emptyMessage={debouncedSearch ? t("finance.expenses.emptySearch") : t("finance.expenses.empty")}
          emptyIcon={<Wallet size={20} />}
          emptyAction={
            !debouncedSearch ? (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                {t("finance.expenses.add")}
              </Button>
            ) : undefined
          }
        >
          <Table aria-label={t("finance.expenses.title")} caption={t("finance.expenses.caption")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("bookingField.title")}</TableCell>
                <TableCell header>{t("finance.expenses.category")}</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>{t("bookingField.amount")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell>{expense.category ?? "—"}</TableCell>
                  <TableCell>{expense.expenseDate ? format.date(expense.expenseDate) : "—"}</TableCell>
                  <TableCell>{format.currency(expense.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
        {data && (
          <AppPagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
        )}
      </CardContent>

      <CreateExpenseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Card>
  );
}
