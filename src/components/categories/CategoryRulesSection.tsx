"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { createCategoryRuleAction, deleteCategoryRuleAction } from "@/actions/category-rules";
import type { Category } from "@/types/finance";

interface CategoryRuleItem {
  id: string;
  keyword: string;
  type: "INCOME" | "EXPENSE";
  category: { id: string; name: string; type: string };
}

export function CategoryRulesSection({
  rules: initialRules,
  categories,
}: {
  rules: CategoryRuleItem[];
  categories: Category[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const result = await createCategoryRuleAction(new FormData(e.currentTarget));
    setCreating(false);
    if (result.success) {
      toast.success(result.message);
      setShowForm(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCategoryRuleAction(id);
    if (result.success) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success(result.message);
      router.refresh();
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-2.5">
          <Wand2 className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="title text-[var(--color-ink)]">Categorization Rules</h2>
          <span className="eyebrow text-[var(--color-ink-faint)] px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
            {rules.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white eyebrow hover:bg-[var(--color-primary-active)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </button>
      </div>

      <p className="px-5 py-3 body-sm text-[var(--color-ink-muted)] border-b border-[var(--color-hairline)]">
        When a transaction description contains a keyword, it will be auto-categorized on import and Gmail sync.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="px-5 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            name="keyword"
            type="text"
            placeholder="Keyword (e.g. swiggy)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm"
          />
          <select name="type" required className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm">
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <select name="categoryId" required className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm">
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}{c.name} ({c.type === "INCOME" ? "Income" : "Expense"})
              </option>
            ))}
          </select>
          <div className="sm:col-span-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm disabled:opacity-60">
              {creating ? "Saving…" : "Save Rule"}
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="px-5 py-8 text-center caption text-[var(--color-ink-faint)]">
          No custom rules yet. Add keywords to auto-categorize merchants you use often.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-hairline)]">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-canvas-soft)] group">
              <div className="min-w-0">
                <p className="body-sm text-[var(--color-ink)]">
                  <span className="font-medium">&quot;{rule.keyword}&quot;</span>
                  <span className="text-[var(--color-ink-muted)]"> → </span>
                  {rule.category.name}
                </p>
                <p className="caption text-[var(--color-ink-faint)]">{rule.type}</p>
              </div>
              <button
                onClick={() => handleDelete(rule.id)}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)] transition-colors"
                aria-label="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
