import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getFilteredExpenseTotal, getTransactions } from "@/lib/db/transactions";
import { getCategories } from "@/lib/db/categories";
import { getAccounts } from "@/lib/db/accounts";
import { transactionFiltersSchema } from "@/lib/validations/transaction";
import { TransactionsView } from "@/components/transactions/TransactionsView";

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

  const [{ transactions, total, pageCount }, categories, accounts, totalExpenses] =
    await Promise.all([
      getTransactions(userId, filters),
      getCategories(userId),
      getAccounts(userId),
      getFilteredExpenseTotal(userId, filters),
    ]);

  return (
    <TransactionsView
      initialTransactions={transactions}
      initialTotal={total}
      initialTotalExpenses={totalExpenses}
      pageCount={pageCount}
      categories={categories}
      accounts={accounts}
      filters={filters}
    />
  );
}
