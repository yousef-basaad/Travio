import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

// tenantId is intentionally absent - resolved from the authenticated
// session, never trusted from the request body, same convention as
// createInvoiceSchema/createPaymentSchema.
export const createExpenseSchema = z.object({
  title: z.string().max(200).trim().min(1, "Title is required"),
  description: z.preprocess(emptyToUndefined, z.string().max(1000).optional()),
  amount: z.number().positive(),
  category: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  // Date-only input, matching invoices' issueDate/dueDate convention -
  // expense_date is a plain `date` column at the DB level.
  expenseDate: z.preprocess(emptyToUndefined, z.string().date().optional()),
});
