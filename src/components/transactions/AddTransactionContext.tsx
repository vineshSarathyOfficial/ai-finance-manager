"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import type { Category } from "@/types/finance";

const AddTransactionContext = createContext<{ openCreate: () => void } | null>(null);

export function AddTransactionProvider({
  categories,
  children,
}: {
  categories: Category[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const openCreate = useCallback(() => {
    setFormKey((k) => k + 1);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AddTransactionContext.Provider value={{ openCreate }}>
      {children}
      {open && (
        <TransactionFormModal
          key={formKey}
          open
          onClose={close}
          categories={categories}
          mode="create"
        />
      )}
    </AddTransactionContext.Provider>
  );
}

export function useAddTransaction() {
  const ctx = useContext(AddTransactionContext);
  if (!ctx) {
    throw new Error("useAddTransaction must be used within AddTransactionProvider");
  }
  return ctx;
}
