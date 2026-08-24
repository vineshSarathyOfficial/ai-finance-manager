import type { Metadata } from "next";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { getRequiredUserId } from "@/lib/auth/session";
import { getTransactions } from "@/lib/db/transactions";
import { getCategories } from "@/lib/db/categories";
import { transactionFiltersSchema } from "@/lib/validations/transaction";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";

export const metadata: Metadata = { title: "Transactions" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const sp = await searchParams;

  const filters = transactionFiltersSchema.parse({
    search: sp.search,
    type: sp.type,
    categoryId: sp.categoryId,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    page: sp.page,
    pageSize: sp.pageSize,
    sortBy: sp.sortBy,
    sortOrder: sp.sortOrder,
  });

  const [{ transactions, total, pageCount }, categories] = await Promise.all([
    getTransactions(userId, filters),
    getCategories(userId),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="heading-2 text-[var(--color-ink)]">Transactions</h1>
          <p className="caption text-[var(--color-ink-muted)] mt-0.5">
            {total} transaction{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/import"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Import Statement</span>
            <span className="sm:hidden">Import</span>
          </Link>
          <AddTransactionButton categories={categories} />
        </div>
      </div>

      <TransactionFilters categories={categories} filters={filters} />

      <TransactionTable
        transactions={transactions}
        categories={categories}
        filters={filters}
        total={total}
        pageCount={pageCount}
      />
    </div>
  );
}
