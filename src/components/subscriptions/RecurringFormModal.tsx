"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { createRecurringAction, updateRecurringAction } from "@/actions/recurring";
import { formatDateInput } from "@/lib/utils";
import type { Category } from "@/types/finance";
import type { Frequency } from "@prisma/client";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export interface RecurringFormItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: Frequency;
  categoryId: string | null;
  nextDueDate: Date | null;
}

interface RecurringFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  mode: "create" | "edit";
  item?: RecurringFormItem;
}

export function RecurringFormModal({
  open,
  onClose,
  categories,
  mode,
  item,
}: RecurringFormModalProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(item?.type ?? "EXPENSE");

  if (!open) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    const result =
      mode === "create"
        ? await createRecurringAction(formData)
        : await updateRecurringAction(item!.id, formData);

    setPending(false);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)]">
          <h2 className="title text-[var(--color-ink)]">
            {mode === "create" ? "Add Recurring" : "Edit Recurring"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">Type</label>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-hairline)] overflow-hidden">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-[15px] font-medium ${
                    type === t ? "bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]" : "text-[var(--color-ink-muted)]"
                  }`}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Name</label>
            <input name="name" defaultValue={item?.name} required className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm" />
          </div>

          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Amount (₹)</label>
            <input name="amount" type="number" step="0.01" min="0.01" defaultValue={item?.amount} required className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm" />
          </div>

          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Frequency</label>
            <select name="frequency" defaultValue={item?.frequency ?? "MONTHLY"} className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm">
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Category (optional)</label>
            <select name="categoryId" defaultValue={item?.categoryId ?? ""} className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm">
              <option value="">None</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Next due date (optional)</label>
            <input
              name="nextDueDate"
              type="date"
              defaultValue={item?.nextDueDate ? formatDateInput(item.nextDueDate) : ""}
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium disabled:opacity-60">
              {pending ? "Saving…" : mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
