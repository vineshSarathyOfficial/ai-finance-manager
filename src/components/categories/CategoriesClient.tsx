"use client";

import { useState, useActionState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, Check } from "lucide-react";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import type { Category } from "@/types/finance";

interface CategoriesClientProps {
  incomeCategories: Category[];
  expenseCategories: Category[];
}

function CategorySection({
  title,
  categories,
  type,
}: {
  title: string;
  categories: Category[];
  type: "INCOME" | "EXPENSE";
}) {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createCategoryAction, undefined);

  const handleDelete = async (id: string) => {
    const result = await deleteCategoryAction(id);
    setDeleteId(null);
    if (result?.success) toast.success(result.message);
    else toast.error(result?.message ?? "Delete failed.");
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full ${type === "INCOME" ? "bg-[var(--color-accent-green)]" : "bg-[var(--color-error)]"}`}
          />
          <h2 className="title text-[var(--color-ink)]">{title}</h2>
          <span className="eyebrow text-[var(--color-ink-faint)] px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
            {categories.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white eyebrow hover:bg-[var(--color-primary-active)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          action={async (fd) => {
            fd.append("type", type);
            await formAction(fd);
            if (state?.success !== false) setShowForm(false);
          }}
          className="px-5 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] flex gap-3"
        >
          <input type="hidden" name="type" value={type} />
          <input
            name="icon"
            type="text"
            placeholder="🏷️"
            maxLength={2}
            className="w-12 px-2 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm text-center focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <input
            name="name"
            type="text"
            placeholder="Category name"
            required
            className="flex-1 px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-8 h-9 flex items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="w-8 h-9 flex items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="px-5 py-8 text-center caption text-[var(--color-ink-faint)]">
          No categories yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-hairline)]">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-canvas-soft)] transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{cat.icon || "📦"}</span>
                <span className="body-sm text-[var(--color-ink)]">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-red-50 hover:text-[var(--color-error)] transition-colors"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 p-6 max-w-sm w-full mx-4">
            <h3 className="title text-[var(--color-ink)] mb-2">Delete Category</h3>
            <p className="body-sm text-[var(--color-ink-muted)]">
              This will delete the category. Transactions using it will still exist.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-error)] text-white body-sm font-medium hover:opacity-90 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoriesClient({ incomeCategories, expenseCategories }: CategoriesClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategorySection title="Income Categories" categories={incomeCategories} type="INCOME" />
      <CategorySection title="Expense Categories" categories={expenseCategories} type="EXPENSE" />
    </div>
  );
}
