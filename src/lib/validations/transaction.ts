import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], {
    error: "Transaction type is required.",
  }),
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number.",
    }),
  description: z
    .string()
    .min(1, { message: "Description is required." })
    .max(255, { message: "Description must be under 255 characters." })
    .trim(),
  categoryId: z.string().min(1, { message: "Category is required." }),
  transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date.",
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// For query/filter
export const transactionFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "ALL"]).optional(),
  categoryId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["transactionDate", "amount", "createdAt"]).default("transactionDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
