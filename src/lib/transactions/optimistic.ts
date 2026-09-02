import type { Category, SerializedTransaction } from "@/types/finance";

export type OptimisticTransaction = SerializedTransaction & { isPending?: boolean };

export function transactionsMatch(
  a: Pick<SerializedTransaction, "description" | "amount" | "type" | "categoryId">,
  b: Pick<SerializedTransaction, "description" | "amount" | "type" | "categoryId">
) {
  return (
    a.description === b.description &&
    a.amount === b.amount &&
    a.type === b.type &&
    a.categoryId === b.categoryId
  );
}

export function buildOptimisticTransaction(
  formData: FormData,
  categories: Category[],
  mode: "create" | "edit",
  existing?: SerializedTransaction,
  optimisticId?: string
): OptimisticTransaction {
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const categoryId = String(formData.get("categoryId") ?? "");
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const amount = parseFloat(String(formData.get("amount") ?? "0"));
  const description = String(formData.get("description") ?? "");
  const dateStr = String(formData.get("transactionDate") ?? "");
  const now = new Date();

  return {
    id: mode === "edit" && existing ? existing.id : (optimisticId ?? `optimistic-${Date.now()}`),
    userId: existing?.userId ?? "",
    type,
    amount,
    description,
    categoryId,
    category,
    transactionDate: new Date(`${dateStr}T12:00:00`),
    paymentMethod: String(formData.get("paymentMethod") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    accountId: String(formData.get("accountId") ?? "") || null,
    importId: null,
    source: "MANUAL",
    emailMessageId: null,
    merchantName: description,
    transactionKind: existing?.transactionKind ?? "REGULAR",
    linkedTransactionId: null,
    emiId: existing?.emiId ?? null,
    excludeFromTotals: false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    isPending: true,
  };
}

export type OptimisticAction =
  | { type: "upsert"; transaction: OptimisticTransaction }
  | { type: "revert"; id: string; previous?: OptimisticTransaction };

export function optimisticTransactionReducer(
  state: OptimisticTransaction[],
  action: OptimisticAction
): OptimisticTransaction[] {
  switch (action.type) {
    case "upsert": {
      const index = state.findIndex((t) => t.id === action.transaction.id);
      if (index >= 0) {
        const next = [...state];
        next[index] = action.transaction;
        return next;
      }
      return [action.transaction, ...state];
    }
    case "revert":
      if (action.previous) {
        const index = state.findIndex((t) => t.id === action.id);
        if (index >= 0) {
          const next = [...state];
          next[index] = action.previous;
          return next;
        }
      }
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}
