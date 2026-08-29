import type { SerializedTransaction } from "@/types/finance";
import type { OptimisticTransaction } from "@/lib/transactions/optimistic";

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

export function dispatchTransactionSaved(detail: TransactionSavedDetail) {
  window.dispatchEvent(new CustomEvent(TRANSACTION_SAVED_EVENT, { detail }));
}

export function dispatchTransactionOptimistic(detail: TransactionOptimisticDetail) {
  window.dispatchEvent(new CustomEvent(TRANSACTION_OPTIMISTIC_EVENT, { detail }));
}

export function dispatchTransactionOptimisticRevert(detail: TransactionOptimisticRevertDetail) {
  window.dispatchEvent(new CustomEvent(TRANSACTION_OPTIMISTIC_REVERT_EVENT, { detail }));
}
