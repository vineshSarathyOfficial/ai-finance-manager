"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { createBudgetAction, deleteBudgetAction } from "@/actions/budgets";
import { toast } from "sonner";
import Link from "next/link";
import type { Category } from "@/types/finance";

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export function BudgetsClient({
  budgets,
  categories,
}: {
  budgets: BudgetItem[];
  categories: Category[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter((c) => !budgetedIds.has(c.id));

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const result = await createBudgetAction(new FormData(e.currentTarget));
    setCreating(false);
    if (result.success) {
      toast.success(result.message);
      setShowCreate(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteBudgetAction(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowCreate(true)} disabled={availableCategories.length === 0}>
          <Plus className="w-4 h-4" /> Set Budget
        </Button>
      </div>

      <div className="space-y-4">
        {budgets.map((budget) => (
          <Card key={budget.id} padding="md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{budget.categoryIcon}</span>
                <div>
                  <p className="title-md text-[var(--color-ink)]">{budget.categoryName}</p>
                  <p className="caption-sm text-[var(--color-ink-muted)]">
                    {formatCurrency(budget.spent)} of {formatCurrency(budget.monthlyLimit)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(budget.id)}
                className="p-2 text-[var(--color-ink-faint)] hover:text-[var(--color-error)] min-h-[40px] min-w-[40px]"
                aria-label="Remove budget"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="h-2 bg-[var(--color-surface-soft)] rounded-[var(--radius-full)] overflow-hidden">
              <div
                className="h-full rounded-[var(--radius-full)] transition-all"
                style={{
                  width: `${Math.min(budget.percentUsed, 100)}%`,
                  background: budget.isOverBudget ? "var(--color-primary)" : "var(--color-ink)",
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className={`caption-sm ${budget.isOverBudget ? "text-[var(--color-primary)]" : "text-[var(--color-ink-muted)]"}`}>
                {budget.isOverBudget
                  ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
                  : `${formatCurrency(budget.remaining)} remaining`}
              </span>
              <Link
                href={`/transactions?categoryId=${budget.categoryId}`}
                className="caption-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                View transactions
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Set Budget">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Category</label>
            <select name="categoryId" required className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm">
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Monthly Limit (₹)</label>
            <input name="monthlyLimit" type="number" required min="1" className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm" />
          </div>
          <Button type="submit" fullWidth disabled={creating}>
            {creating ? "Saving…" : "Save Budget"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
