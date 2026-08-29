"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { createTransactionAction, updateTransactionAction } from "@/actions/transactions";
import { formatDateInput } from "@/lib/utils";
import type { Category, SerializedTransaction } from "@/types/finance";

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  mode: "create" | "edit";
  transaction?: SerializedTransaction;
}

const PAYMENT_METHODS = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "Cheque", "Other"];

export function TransactionFormModal({
  open,
  onClose,
  categories,
  mode,
  transaction,
}: TransactionFormModalProps) {
  const action = mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Initialize type based on transaction or default
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    () => transaction?.type ?? "EXPENSE"
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onClose();
    }
  }, [state, onClose]);

  if (!open) return null;

  const err = (field: string) =>
    state && !state.success ? state.errors?.[field]?.[0] : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-hairline)] sticky top-0 bg-[var(--color-surface)] z-10">
          <h2 id="modal-title" className="title text-[var(--color-ink)]">
            {mode === "create" ? "Add Transaction" : "Edit Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-6 py-5 space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="id" value={transaction?.id} />
          )}

          {/* Type toggle */}
          <div>
            <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
              Type
            </label>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-hairline)] overflow-hidden">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-[15px] font-medium transition-colors ${
                    type === t
                      ? t === "EXPENSE"
                        ? "bg-red-50 text-[var(--color-error)]"
                        : "bg-[var(--color-income-bg)] text-[var(--color-income)]"
                      : "bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]"
                  }`}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Amount (₹)
            </label>
            <input
              id="tx-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={transaction?.amount?.toString()}
              placeholder="0.00"
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {err("amount") && <p className="caption text-[var(--color-error)] mt-1">{err("amount")}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-desc" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Description
            </label>
            <input
              id="tx-desc"
              name="description"
              type="text"
              defaultValue={transaction?.description}
              placeholder="e.g. Swiggy order"
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {err("description") && <p className="caption text-[var(--color-error)] mt-1">{err("description")}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tx-category" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Category
            </label>
            <select
              id="tx-category"
              name="categoryId"
              defaultValue={transaction?.categoryId ?? ""}
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ""}{c.name}
                </option>
              ))}
            </select>
            {err("categoryId") && <p className="caption text-[var(--color-error)] mt-1">{err("categoryId")}</p>}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Date
            </label>
            <input
              id="tx-date"
              name="transactionDate"
              type="date"
              defaultValue={
                transaction?.transactionDate
                  ? formatDateInput(transaction.transactionDate)
                  : formatDateInput(new Date())
              }
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {err("transactionDate") && <p className="caption text-[var(--color-error)] mt-1">{err("transactionDate")}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="tx-payment" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Payment Method <span className="normal-case font-normal text-[var(--color-ink-faint)]">(optional)</span>
            </label>
            <select
              id="tx-payment"
              name="paymentMethod"
              defaultValue={transaction?.paymentMethod ?? ""}
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="tx-notes" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Notes <span className="normal-case font-normal text-[var(--color-ink-faint)]">(optional)</span>
            </label>
            <textarea
              id="tx-notes"
              name="notes"
              rows={2}
              defaultValue={transaction?.notes ?? ""}
              placeholder="Any additional notes…"
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors resize-none"
            />
          </div>

          {/* Generic error */}
          {state && !state.success && !state.errors && (
            <p className="caption text-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2 rounded-[var(--radius-md)]">
              {state.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] text-[var(--color-ink-secondary)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              id="tx-submit-btn"
              className="flex-1 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] active:scale-[0.97] transition-all disabled:opacity-60"
            >
              {pending
                ? "Saving…"
                : mode === "create"
                ? "Add Transaction"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionFormModal;
