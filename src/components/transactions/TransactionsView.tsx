"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import {
  TRANSACTION_OPTIMISTIC_EVENT,
  TRANSACTION_OPTIMISTIC_REVERT_EVENT,
  TRANSACTION_SAVED_EVENT,
  type TransactionOptimisticDetail,
  type TransactionOptimisticRevertDetail,
  type TransactionSavedDetail,
} from "@/lib/transactions/events";
import type { OptimisticTransaction } from "@/lib/transactions/optimistic";
import type { Account, Category, SerializedTransaction } from "@/types/finance";
import type { TransactionFilters as TransactionFiltersType } from "@/lib/validations/transaction";

interface TransactionsViewProps {
  initialTransactions: SerializedTransaction[];
  initialTotal: number;
  pageCount: number;
  categories: Category[];
  accounts: Account[];
  filters: TransactionFiltersType;
}

export function TransactionsView({
  initialTransactions,
  initialTotal,
  pageCount,
  categories,
  accounts,
  filters,
}: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<OptimisticTransaction[]>(initialTransactions);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    setTransactions(initialTransactions);
    setTotal(initialTotal);
  }, [initialTransactions, initialTotal]);

  const applyOptimistic = useCallback((transaction: OptimisticTransaction, mode: "create" | "edit") => {
    setTransactions((prev) => {
      if (mode === "edit") {
        return prev.map((t) => (t.id === transaction.id ? transaction : t));
      }
      if (prev.some((t) => t.id === transaction.id)) return prev;
      return [transaction, ...prev];
    });
    if (mode === "create") {
      setTotal((t) => t + 1);
    }
  }, []);

  const revertOptimistic = useCallback(
    (id: string, mode: "create" | "edit", previous?: OptimisticTransaction) => {
      setTransactions((prev) => {
        if (previous) {
          return prev.map((t) => (t.id === id ? previous : t));
        }
        return prev.filter((t) => t.id !== id);
      });
      if (mode === "create") {
        setTotal((t) => Math.max(0, t - 1));
      }
    },
    []
  );

  const confirmTransaction = useCallback(
    (transaction: SerializedTransaction, mode: "create" | "edit", optimisticId?: string) => {
      setTransactions((prev) => {
        if (mode === "create") {
          const cleaned = prev.filter(
            (t) => t.id !== optimisticId && !t.id.startsWith("optimistic-")
          );
          if (cleaned.some((t) => t.id === transaction.id)) return cleaned;
          return [{ ...transaction, isPending: false }, ...cleaned];
        }
        return prev.map((t) =>
          t.id === transaction.id ? { ...transaction, isPending: false } : t
        );
      });
    },
    []
  );

  useEffect(() => {
    const onOptimistic = (event: Event) => {
      const { transaction, mode } = (event as CustomEvent<TransactionOptimisticDetail>).detail;
      applyOptimistic(transaction, mode);
    };

    const onRevert = (event: Event) => {
      const { id, mode, previous } = (event as CustomEvent<TransactionOptimisticRevertDetail>).detail;
      revertOptimistic(id, mode, previous);
    };

    const onSaved = (event: Event) => {
      const { transaction, mode, optimisticId } = (event as CustomEvent<TransactionSavedDetail>).detail;
      confirmTransaction(transaction, mode, optimisticId);
    };

    window.addEventListener(TRANSACTION_OPTIMISTIC_EVENT, onOptimistic);
    window.addEventListener(TRANSACTION_OPTIMISTIC_REVERT_EVENT, onRevert);
    window.addEventListener(TRANSACTION_SAVED_EVENT, onSaved);

    return () => {
      window.removeEventListener(TRANSACTION_OPTIMISTIC_EVENT, onOptimistic);
      window.removeEventListener(TRANSACTION_OPTIMISTIC_REVERT_EVENT, onRevert);
      window.removeEventListener(TRANSACTION_SAVED_EVENT, onSaved);
    };
  }, [applyOptimistic, revertOptimistic, confirmTransaction]);

  const handleTransactionDeleted = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const handleBulkDeleted = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
    setTotal((t) => Math.max(0, t - ids.length));
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
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
            <div className="hidden sm:block">
              <AddTransactionButton categories={categories} accounts={accounts} />
            </div>
          </div>
        }
      />

      <TransactionFilters categories={categories} accounts={accounts} filters={filters} />

      <TransactionTable
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        filters={filters}
        total={total}
        pageCount={pageCount}
        onTransactionDeleted={handleTransactionDeleted}
        onBulkDeleted={handleBulkDeleted}
      />
    </div>
  );
}
