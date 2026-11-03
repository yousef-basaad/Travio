"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "@travio/api";
import { fetchPage, type PageQuery } from "@/lib/api/fetch-page";

// A separate file (not folded into invoices.api.ts) - expenses is a
// flat, independent resource with no FK relationship to invoices/
// payments, unlike invoice-items/payments which are genuinely nested
// under a specific invoice.
export const EXPENSES_QUERY_KEY = ["expenses"];

// One page of the agency's expenses (newest first), searchable by title
// and category.
export function useExpensesPage(query: Pick<PageQuery, "page" | "pageSize" | "search">) {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, "page", query],
    queryFn: () => fetchPage<Expense>("/api/expenses", query),
    placeholderData: keepPreviousData,
  });
}

async function fetchExpenseTotal(): Promise<number> {
  const response = await fetch("/api/expenses/total");

  if (!response.ok) {
    throw new Error(`Failed to load the expense total (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || typeof (data as { total: unknown }).total !== "number") {
    throw new Error("Unexpected response from /api/expenses/total");
  }

  return (data as { total: number }).total;
}

// Sum of all the agency's expenses, computed in Postgres (summing a
// fetched list stops at the 1000-row response cap). Under
// EXPENSES_QUERY_KEY, so adding an expense refreshes it.
export function useExpenseTotal() {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, "total"],
    queryFn: fetchExpenseTotal,
  });
}

async function createExpense({
  title,
  description,
  amount,
  category,
  expenseDate,
}: {
  title: string;
  description?: string;
  amount: number;
  category?: string;
  expenseDate?: string;
}): Promise<Expense> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, amount, category, expenseDate }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create expense (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/expenses");
  }

  return data as Expense;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
    },
  });
}
