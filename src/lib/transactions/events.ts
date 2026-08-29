import type { SerializedTransaction } from "@/types/finance";
import {
  transactionsMatch,
  type OptimisticTransaction,
} from "@/lib/transactions/optimistic";

export const TRANSACTION_SAVED_EVENT = "finpulse:transaction-saved";
export const TRANSACTION_OPTIMISTIC_EVENT = "finpulse:transaction-optimistic";
export const TRANSACTION_OPTIMISTIC_REVERT_EVENT = "finpulse:transaction-optimistic-revert";

export interface TransactionSavedDetail {
  transaction: SerializedTransaction;
  mode: "create" | "edit";
  optimisticId?: string;
}

export interface TransactionOptimisticDetail {
  transaction: OptimisticTransaction;
  mode: "create" | "edit";
}

export interface TransactionOptimisticRevertDetail {
  id: string;
  mode: "create" | "edit";
  previous?: OptimisticTransaction;
}

const pendingOptimistic = new Map<string, OptimisticTransaction>();

export function getPendingOptimisticTransactions(): OptimisticTransaction[] {
  return Array.from(pendingOptimistic.values());
}

export function removePendingOptimistic(id: string) {
  pendingOptimistic.delete(id);
}

export function removePendingMatching(
  transaction: Pick<SerializedTransaction, "description" | "amount" | "type" | "categoryId">
) {
  for (const [id, opt] of pendingOptimistic) {
    if (transactionsMatch(opt, transaction)) {
      pendingOptimistic.delete(id);
    }
  }
}

export function dispatchTransactionSaved(detail: TransactionSavedDetail) {
  if (detail.optimisticId) {
    pendingOptimistic.delete(detail.optimisticId);
  }
  if (detail.mode === "create") {
    for (const id of [...pendingOptimistic.keys()]) {
      if (id.startsWith("optimistic-")) pendingOptimistic.delete(id);
    }
  } else {
    pendingOptimistic.delete(detail.transaction.id);
  }
  window.dispatchEvent(new CustomEvent(TRANSACTION_SAVED_EVENT, { detail }));
}

export function dispatchTransactionOptimistic(detail: TransactionOptimisticDetail) {
  pendingOptimistic.set(detail.transaction.id, detail.transaction);
  window.dispatchEvent(new CustomEvent(TRANSACTION_OPTIMISTIC_EVENT, { detail }));
}

export function dispatchTransactionOptimisticRevert(detail: TransactionOptimisticRevertDetail) {
  pendingOptimistic.delete(detail.id);
  window.dispatchEvent(new CustomEvent(TRANSACTION_OPTIMISTIC_REVERT_EVENT, { detail }));
}
