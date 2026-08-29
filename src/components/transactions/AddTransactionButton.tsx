"use client";

import { Plus } from "lucide-react";
import { useAddTransaction } from "./AddTransactionContext";

export function AddTransactionButton() {
  const { openCreate } = useAddTransaction();

  return (
    <button
      id="add-transaction-btn"
      type="button"
      onClick={openCreate}
      className="hidden sm:flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white font-medium text-[15px] hover:bg-[var(--color-primary-active)] transition-all active:scale-[0.97] flex-shrink-0 min-h-[44px]"
    >
      <Plus className="w-4 h-4" />
      Add Transaction
    </button>
  );
}
