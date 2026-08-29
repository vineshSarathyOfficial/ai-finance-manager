"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getCategoriesAction } from "@/actions/categories";
import { getAccountsAction } from "@/actions/accounts";
import { cn } from "@/lib/utils";
import type { Category, Account } from "@/types/finance";

const TransactionFormModal = dynamic(
  () =>
    import("@/components/transactions/TransactionFormModal").then(
      (mod) => mod.TransactionFormModal
    ),
  { ssr: false }
);

export function AddTransactionFab() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (loading) return;

    if (!categories || !accounts) {
      setLoading(true);
      try {
        const [cats, accts] = await Promise.all([getCategoriesAction(), getAccountsAction()]);
        setCategories(cats);
        setAccounts(accts);
      } catch {
        toast.error("Could not load form data. Please try again.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setOpen(true);
  };

  return (
    <>
      <button
        id="add-transaction-fab"
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={cn(
          "fixed z-40 lg:hidden",
          "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4",
          "w-12 h-12 rounded-[var(--radius-full)]",
          "bg-[var(--color-primary)] text-white shadow-level-2",
          "flex items-center justify-center",
          "transition-all active:scale-[0.97]",
          "disabled:opacity-70"
        )}
        aria-label="Add transaction"
        title="Add transaction"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {open && categories && accounts && (
        <TransactionFormModal
          open
          onClose={() => setOpen(false)}
          categories={categories}
          accounts={accounts}
          mode="create"
        />
      )}
    </>
  );
}
