"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ChevronDown, X } from "lucide-react";
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
  const amountRef = useRef<HTMLInputElement>(null);
  const closedForSuccess = useRef(false);

  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    () => transaction?.type ?? "EXPENSE"
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [showMore, setShowMore] = useState(Boolean(transaction?.paymentMethod || transaction?.notes));

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategoryId = filteredCategories.some((c) => c.id === categoryId)
    ? categoryId
    : "";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      if (mode === "create") amountRef.current?.focus();
    }, 80);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(focusTimer);
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open || !state?.success || closedForSuccess.current) return;
    closedForSuccess.current = true;
    toast.success(state.message);
    onClose();
  }, [state, open, onClose]);

  if (!open) return null;

  const err = (field: string) =>
    state && !state.success ? state.errors?.[field]?.[0] : undefined;

  const fieldClass =
    "w-full h-12 px-3.5 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 max-h-[92dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-hairline)] flex-shrink-0">
          <h2 id="modal-title" className="title text-[var(--color-ink)]">
            {mode === "create" ? "Add Transaction" : "Edit Transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="flex flex-col min-h-0 flex-1">
          {mode === "edit" && (
            <input type="hidden" name="id" value={transaction?.id} />
          )}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={selectedCategoryId} />

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
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
                    className={`flex-1 min-h-[48px] text-[15px] font-medium transition-colors ${
                      type === t
                        ? t === "EXPENSE"
                          ? "bg-red-50 text-[var(--color-error)]"
                          : "bg-[var(--color-income-bg)] text-[var(--color-income)]"
                        : "bg-[var(--color-surface)] text-[var(--color-ink-muted)]"
                    }`}
                  >
                    {t === "EXPENSE" ? "Expense" : "Income"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="tx-amount" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                Amount (₹)
              </label>
              <input
                ref={amountRef}
                id="tx-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                defaultValue={transaction?.amount?.toString()}
                placeholder="0.00"
                required
                className={fieldClass}
              />
              {err("amount") && <p className="caption text-[var(--color-error)] mt-1">{err("amount")}</p>}
            </div>

            <div>
              <label htmlFor="tx-desc" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                Description
              </label>
              <input
                id="tx-desc"
                name="description"
                type="text"
                enterKeyHint="next"
                defaultValue={transaction?.description}
                placeholder="e.g. Swiggy order"
                required
                className={fieldClass}
              />
              {err("description") && <p className="caption text-[var(--color-error)] mt-1">{err("description")}</p>}
            </div>

            <div>
              <label htmlFor="tx-category" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                Category
              </label>
              <select
                id="tx-category"
                value={selectedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className={fieldClass}
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
                className={fieldClass}
              />
              {err("transactionDate") && <p className="caption text-[var(--color-error)] mt-1">{err("transactionDate")}</p>}
            </div>

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 caption text-[var(--color-primary)] font-medium py-1"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
              {showMore ? "Hide extra fields" : "Payment method & notes"}
            </button>

            <div className={showMore ? "space-y-4" : "hidden"}>
              <div>
                <label htmlFor="tx-payment" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                  Payment Method
                </label>
                <select
                  id="tx-payment"
                  name="paymentMethod"
                  defaultValue={transaction?.paymentMethod ?? ""}
                  className={fieldClass}
                >
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tx-notes" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                  Notes
                </label>
                <textarea
                  id="tx-notes"
                  name="notes"
                  rows={2}
                  defaultValue={transaction?.notes ?? ""}
                  placeholder="Any additional notes…"
                  className={`${fieldClass} h-auto py-3 resize-none`}
                />
              </div>
            </div>

            {state && !state.success && !state.errors && (
              <p className="caption text-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2 rounded-[var(--radius-md)]">
                {state.message}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-[var(--color-hairline)] px-4 sm:px-5 py-3 flex gap-3 bg-[var(--color-surface)] safe-area-bottom">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-[var(--radius-full)] border border-[var(--color-hairline)] text-[var(--color-ink-secondary)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !selectedCategoryId}
              id="tx-submit-btn"
              className="flex-1 min-h-[48px] rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] active:scale-[0.97] transition-all disabled:opacity-60"
            >
              {pending
                ? "Saving…"
                : mode === "create"
                ? "Add"
                : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionFormModal;
