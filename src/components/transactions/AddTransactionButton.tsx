"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import type { Category } from "@/types/finance";

interface AddTransactionButtonProps {
  categories: Category[];
}

export function AddTransactionButton({ categories }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="add-transaction-btn"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white font-medium text-[15px] hover:bg-[var(--color-primary-active)] transition-all active:scale-[0.97] flex-shrink-0 min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Transaction</span>
        <span className="sm:hidden">Add</span>
      </button>
      {open && (
        <TransactionFormModal
          open
          onClose={() => setOpen(false)}
          categories={categories}
          mode="create"
        />
      )}
    </>
  );
}
