"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types/finance";

export interface SplitRow {
  categoryId: string;
  amount: string;
}

interface TransactionSplitEditorProps {
  transactionId: string;
  totalAmount: number;
  categories: Category[];
  type: "INCOME" | "EXPENSE";
  initialSplits: { categoryId: string; amount: number }[];
  onChange: (splits: { categoryId: string; amount: number }[]) => void;
  onEnabledChange?: (enabled: boolean) => void;
}

export function TransactionSplitEditor({
  totalAmount,
  categories,
  type,
  initialSplits,
  onChange,
  onEnabledChange,
}: TransactionSplitEditorProps) {
  const [enabled, setEnabled] = useState(initialSplits.length > 0);
  const [rows, setRows] = useState<SplitRow[]>(
    initialSplits.length > 0
      ? initialSplits.map((s) => ({ categoryId: s.categoryId, amount: String(s.amount) }))
      : [{ categoryId: "", amount: "" }, { categoryId: "", amount: "" }]
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    onEnabledChange?.(enabled);
    if (!enabled) {
      onChange([]);
      return;
    }
    const splits = rows
      .filter((r) => r.categoryId && r.amount && !isNaN(parseFloat(r.amount)))
      .map((r) => ({ categoryId: r.categoryId, amount: parseFloat(r.amount) }));
    onChange(splits);
  }, [enabled, rows, onChange, onEnabledChange]);

  const splitTotal = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const remaining = Math.round((totalAmount - splitTotal) * 100) / 100;

  return (
    <div className="border border-[var(--color-hairline)] rounded-[var(--radius-md)] p-3 space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-[var(--color-hairline)]"
        />
        <span className="body-sm text-[var(--color-ink)]">Split across categories</span>
      </label>

      {enabled && (
        <>
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                value={row.categoryId}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx], categoryId: e.target.value };
                  setRows(next);
                }}
                className="flex-1 px-2 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm"
              >
                <option value="">Category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}{c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx], amount: e.target.value };
                  setRows(next);
                }}
                className="w-28 px-2 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-error)]"
                aria-label="Remove split"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows([...rows, { categoryId: "", amount: "" }])}
            className="flex items-center gap-1 text-[var(--color-primary)] body-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add split
          </button>
          <p className={`caption ${Math.abs(remaining) < 0.01 ? "text-[var(--color-income)]" : "text-[var(--color-warning)]"}`}>
            {Math.abs(remaining) < 0.01
              ? "Splits match transaction total."
              : `Remaining: ₹${remaining.toFixed(2)} of ₹${totalAmount.toFixed(2)}`}
          </p>
        </>
      )}
    </div>
  );
}
