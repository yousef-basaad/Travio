"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "@travio/api";

// A separate file (not folded into invoices.api.ts) - expenses is a
// flat, independent resource with no FK relationship to invoices/
// payments, unlike invoice-items/payments which are genuinely nested
// under a specific invoice.
export const EXPENSES_QUERY_KEY = ["expenses"];

async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch("/api/expenses");

  if (!response.ok) {
    throw new Error(`Failed to load expenses (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/expenses");
  }

  return data as Expense[];
}

export function useExpenses() {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEY,
    queryFn: fetchExpenses,
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
