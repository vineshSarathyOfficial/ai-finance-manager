import type { Category, Transaction, StatementImport, TransactionType, ImportStatus, RecurringTransaction, Frequency } from "@prisma/client";

export type { Category, Transaction, StatementImport, TransactionType, ImportStatus, RecurringTransaction, Frequency };

/**
 * TransactionWithCategory — raw Prisma shape (server-only, not for Client Components).
 * amount is a Prisma Decimal object.
 */
export type TransactionWithCategory = Transaction & {
  category: Category;
};

/**
 * SerializedTransaction — safe to pass to Client Components.
 * amount is already converted to a plain JS number.
 */
export type SerializedTransaction = Omit<Transaction, "amount"> & {
  amount: number;
  category: Category;
};

export interface DashboardSummary {
  incomeThisMonth: number;
  expensesThisMonth: number;
  savingsThisMonth: number;
  savingsRate: number;
  netCashFlow: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategorySpendData {
  name: string;
  icon: string | null;
  amount: number;
}
