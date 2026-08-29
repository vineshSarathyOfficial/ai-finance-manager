import type { Metadata } from "next";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { getRequiredUserId } from "@/lib/auth/session";
import { getTransactions } from "@/lib/db/transactions";
import { getCategories } from "@/lib/db/categories";
import { getAccounts } from "@/lib/db/accounts";
import { transactionFiltersSchema } from "@/lib/validations/transaction";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

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
    accountId: sp.accountId,
    merchant: sp.merchant,
    paymentMethod: sp.paymentMethod,
    transactionKind: sp.transactionKind,
    minAmount: sp.minAmount,
    maxAmount: sp.maxAmount,
    excludeTransfers: sp.excludeTransfers,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    page: sp.page,
    pageSize: sp.pageSize,
    sortBy: sp.sortBy,
    sortOrder: sp.sortOrder,
  });

  const [{ transactions, total, pageCount }, categories, accounts] = await Promise.all([
    getTransactions(userId, filters),
    getCategories(userId),
    getAccounts(userId),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description={`${total} transaction${total !== 1 ? "s" : ""} found`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/import" className="hidden sm:block">
              <Button variant="secondary" size="sm">
                <UploadCloud className="w-4 h-4" />
                Import
              </Button>
            </Link>
            <AddTransactionButton categories={categories} />
          </div>
        }
      />

      <TransactionFilters categories={categories} accounts={accounts} filters={filters} />

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
