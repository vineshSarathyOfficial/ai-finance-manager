"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionTotalsBar } from "@/components/transactions/TransactionTotalsBar";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import {
  TRANSACTION_OPTIMISTIC_EVENT,
  TRANSACTION_OPTIMISTIC_REVERT_EVENT,
  TRANSACTION_SAVED_EVENT,
  getPendingOptimisticTransactions,
  removePendingMatching,
  removePendingOptimistic,
  type TransactionOptimisticDetail,
  type TransactionOptimisticRevertDetail,
  type TransactionSavedDetail,
} from "@/lib/transactions/events";
import {
  transactionsMatch,
  type OptimisticTransaction,
} from "@/lib/transactions/optimistic";
import { matchesTransactionFilters } from "@/lib/transactions/filter-match";
import type { Account, Category, SerializedTransaction } from "@/types/finance";
import type { TransactionFilters as TransactionFiltersType } from "@/lib/validations/transaction";

function stripStaleOptimistic(
  list: OptimisticTransaction[],
  serverTransactions: SerializedTransaction[]
) {
  return list.filter((item) => {
    if (!item.isPending && !item.id.startsWith("optimistic-")) return true;
    return !serverTransactions.some((saved) => transactionsMatch(item, saved));
  });
}

function collectRemovalIds(list: OptimisticTransaction[], target: OptimisticTransaction) {
  const idsToRemove = new Set<string>([target.id]);
  if (target.id.startsWith("optimistic-")) {
    return idsToRemove;
  }
  for (const t of list) {
    if (
      t.id !== target.id &&
      !target.id.startsWith("optimistic-") &&
      (t.isPending || t.id.startsWith("optimistic-")) &&
      transactionsMatch(t, target)
    ) {
      idsToRemove.add(t.id);
    }
  }
  return idsToRemove;
}
function mergeTransactions(
  initialTransactions: SerializedTransaction[],
  deletedIds: Set<string>,
  filters: TransactionFiltersType
) {
  const pending = getPendingOptimisticTransactions();
  let merged = stripStaleOptimistic(
    initialTransactions.filter((t) => !deletedIds.has(t.id)),
    initialTransactions
  );
  let extraCount = 0;

  for (const opt of pending) {
    if (deletedIds.has(opt.id)) continue;
    if (!matchesTransactionFilters(opt, filters)) continue;
    if (
      opt.id.startsWith("optimistic-") &&
      initialTransactions.some((saved) => transactionsMatch(opt, saved))
    ) {
      continue;
    }
    const index = merged.findIndex((t) => t.id === opt.id);
    if (index >= 0) {
      merged[index] = opt;
    } else {
      merged = [opt, ...merged];
      if (opt.id.startsWith("optimistic-")) extraCount += 1;
    }
  }

  return { merged, extraCount };
}

interface TransactionsViewProps {
  initialTransactions: SerializedTransaction[];
  initialTotal: number;
  initialTotalExpenses: number;
  pageCount: number;
  categories: Category[];
  accounts: Account[];
  filters: TransactionFiltersType;
}

export function TransactionsView({
  initialTransactions,
  initialTotal,
  initialTotalExpenses,
  pageCount,
  categories,
  accounts,
  filters,
}: TransactionsViewProps) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [transactions, setTransactions] = useState<OptimisticTransaction[]>(() => {
    return mergeTransactions(initialTransactions, new Set(), filters).merged;
  });
  const [total, setTotal] = useState(() => {
    const { extraCount } = mergeTransactions(initialTransactions, new Set(), filters);
    return initialTotal + extraCount;
  });

  useEffect(() => {
    const { merged, extraCount } = mergeTransactions(initialTransactions, deletedIds, filters);
    setTransactions(merged);
    setTotal(initialTotal + extraCount);
  }, [initialTransactions, initialTotal, deletedIds, filters]);

  const applyOptimistic = useCallback(
    (transaction: OptimisticTransaction, mode: "create" | "edit") => {
      setTransactions((prev) => {
        if (mode === "edit") {
          if (!matchesTransactionFilters(transaction, filters)) {
            return prev.filter((t) => t.id !== transaction.id);
          }
          return prev.map((t) => (t.id === transaction.id ? transaction : t));
        }
        if (!matchesTransactionFilters(transaction, filters)) return prev;
        if (prev.some((t) => t.id === transaction.id)) return prev;
        return [transaction, ...prev];
      });
      if (mode === "create" && matchesTransactionFilters(transaction, filters)) {
        setTotal((t) => t + 1);
      }
    },
    [filters]
  );

  const revertOptimistic = useCallback(
    (id: string, mode: "create" | "edit", previous?: OptimisticTransaction) => {
      setTransactions((prev) => {
        if (previous) {
          if (!matchesTransactionFilters(previous, filters)) {
            return prev.filter((t) => t.id !== id);
          }
          return prev.map((t) => (t.id === id ? previous : t));
        }
        return prev.filter((t) => t.id !== id);
      });
      if (mode === "create") {
        setTotal((t) => Math.max(0, t - 1));
      }
    },
    [filters]
  );

  const confirmTransaction = useCallback(
    (transaction: SerializedTransaction, mode: "create" | "edit", optimisticId?: string) => {
      setTransactions((prev) => {
        if (mode === "create") {
          const cleaned = prev.filter((t) => {
            if (t.id === optimisticId) return false;
            if (t.id.startsWith("optimistic-")) return false;
            if (t.isPending) return false;
            if (transactionsMatch(t, transaction)) return false;
            return true;
          });
          if (!matchesTransactionFilters(transaction, filters)) {
            return cleaned;
          }
          if (cleaned.some((t) => t.id === transaction.id)) return cleaned;
          return [{ ...transaction, isPending: false }, ...cleaned];
        }
        if (!matchesTransactionFilters(transaction, filters)) {
          return prev.filter((t) => t.id !== transaction.id);
        }
        return prev.map((t) =>
          t.id === transaction.id ? { ...transaction, isPending: false } : t
        );
      });
    },
    [filters]
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

  const removeFromList = useCallback((target: OptimisticTransaction) => {
    setTransactions((prev) => {
      const idsToRemove = collectRemovalIds(prev, target);
      for (const id of idsToRemove) removePendingOptimistic(id);
      removePendingMatching(target);

      const removedCount = prev.filter((t) => idsToRemove.has(t.id)).length;
      if (removedCount > 0) {
        setTotal((t) => Math.max(0, t - removedCount));
        setDeletedIds((prevIds) => {
          const next = new Set(prevIds);
          idsToRemove.forEach((id) => next.add(id));
          return next;
        });
      }

      return prev.filter((t) => !idsToRemove.has(t.id));
    });
  }, []);

  const handleTransactionDeleted = useCallback(
    (target: OptimisticTransaction) => {
      removeFromList(target);
    },
    [removeFromList]
  );

  const handleTransactionRestored = useCallback((transaction: OptimisticTransaction) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(transaction.id);
      return next;
    });
    if (!matchesTransactionFilters(transaction, filters)) return;
    setTransactions((prev) => {
      if (prev.some((t) => t.id === transaction.id)) return prev;
      return [{ ...transaction, isPending: false }, ...prev];
    });
    setTotal((t) => t + 1);
  }, [filters]);

  const handleBulkDeleted = useCallback((targets: OptimisticTransaction[]) => {
    setTransactions((prev) => {
      const idsToRemove = new Set<string>();
      for (const target of targets) {
        collectRemovalIds(prev, target).forEach((id) => idsToRemove.add(id));
        removePendingOptimistic(target.id);
        removePendingMatching(target);
      }

      const removedCount = prev.filter((t) => idsToRemove.has(t.id)).length;
      if (removedCount > 0) {
        setTotal((t) => Math.max(0, t - removedCount));
        setDeletedIds((prevIds) => {
          const next = new Set(prevIds);
          idsToRemove.forEach((id) => next.add(id));
          return next;
        });
      }

      return prev.filter((t) => !idsToRemove.has(t.id));
    });
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

      <TransactionTotalsBar
        totalExpenses={initialTotalExpenses}
        transactionCount={total}
        filters={filters}
      />

      <TransactionTable
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        filters={filters}
        total={total}
        pageCount={pageCount}
        onTransactionDeleted={handleTransactionDeleted}
        onTransactionRestored={handleTransactionRestored}
        onBulkDeleted={handleBulkDeleted}
      />
    </div>
  );
}
