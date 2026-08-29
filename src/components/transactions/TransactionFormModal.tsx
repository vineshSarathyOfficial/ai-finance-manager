"use client";

import { useState, useActionState, useEffect, useRef, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { createTransactionAction, updateTransactionAction, getTransactionSplitsAction } from "@/actions/transactions";
import { formatDateInput } from "@/lib/utils";
import {
  dispatchTransactionSaved,
  dispatchTransactionOptimistic,
  dispatchTransactionOptimisticRevert,
} from "@/lib/transactions/events";
import { buildOptimisticTransaction } from "@/lib/transactions/optimistic";
import { TransactionSplitEditor } from "./TransactionSplitEditor";
import type { Category, SerializedTransaction, Account } from "@/types/finance";

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  categories: Category[];
  accounts: Account[];
  mode: "create" | "edit";
  transaction?: SerializedTransaction;
}

const PAYMENT_METHODS = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "Cheque", "Other"];

interface TransactionFormModalContentProps {
  visible: boolean;
  onDismiss: () => void;
  onFinished: () => void;
  categories: Category[];
  accounts: Account[];
  mode: "create" | "edit";
  transaction?: SerializedTransaction;
}

function TransactionFormModalContent({
  visible,
  onDismiss,
  onFinished,
  categories,
  accounts,
  mode,
  transaction,
}: TransactionFormModalContentProps) {
  const [, startTransition] = useTransition();
  const action = mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const amountRef = useRef<HTMLInputElement>(null);
  const optimisticIdRef = useRef<string | null>(null);
  const previousTransactionRef = useRef<SerializedTransaction | undefined>(transaction);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(() => transaction?.type ?? "EXPENSE");
  const [formKey, setFormKey] = useState(0);
  const addAnotherRef = useRef(false);
  const [splits, setSplits] = useState<{ categoryId: string; amount: number }[]>([]);
  const [splitsEnabled, setSplitsEnabled] = useState(false);
  const [initialSplits, setInitialSplits] = useState<{ categoryId: string; amount: number }[]>([]);
  const handleSplitsChange = useCallback((next: { categoryId: string; amount: number }[]) => {
    setSplits(next);
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);
  const shouldManageSplits = splitsEnabled || initialSplits.length > 0;
  const defaultAccountId =
    transaction?.accountId ??
    accounts.find((a) => a.isDefault)?.id ??
    accounts[0]?.id ??
    "";

  useEffect(() => {
    amountRef.current?.focus();
  }, [formKey]);

  useEffect(() => {
    if (mode !== "edit" || !transaction?.id) return;
    getTransactionSplitsAction(transaction.id).then((data) => {
      const mapped = data.map((s) => ({ categoryId: s.categoryId, amount: s.amount }));
      setInitialSplits(mapped);
      setSplits(mapped);
      setSplitsEnabled(mapped.length > 0);
    });
  }, [mode, transaction?.id]);

  useEffect(() => {
    if (!state) return;

    if (!state.success) {
      addAnotherRef.current = false;
      if (optimisticIdRef.current) {
        dispatchTransactionOptimisticRevert({
          id: optimisticIdRef.current,
          mode,
          previous:
            mode === "edit" && previousTransactionRef.current
              ? { ...previousTransactionRef.current, isPending: false }
              : undefined,
        });
        optimisticIdRef.current = null;
      }
      if (state.message && !state.errors) {
        toast.error(state.message);
      }
      return;
    }

    toast.success(state.message);

    if (state.transaction) {
      dispatchTransactionSaved({
        transaction: state.transaction,
        mode,
        optimisticId: optimisticIdRef.current ?? undefined,
      });
      optimisticIdRef.current = null;
    }

    if (addAnotherRef.current && mode === "create") {
      addAnotherRef.current = false;
      setType("EXPENSE");
      setFormKey((k) => k + 1);
      return;
    }

    onFinished();
  }, [state, onFinished, mode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const optimisticId =
      mode === "create" ? `optimistic-${Date.now()}` : (transaction?.id ?? `optimistic-${Date.now()}`);
    optimisticIdRef.current = optimisticId;

    const optimisticTx = buildOptimisticTransaction(
      formData,
      categories,
      mode,
      transaction,
      optimisticId
    );

    dispatchTransactionOptimistic({ transaction: optimisticTx, mode });

    if (!addAnotherRef.current) {
      onDismiss();
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const err = (field: string) =>
    state && !state.success ? state.errors?.[field]?.[0] : undefined;

  if (!visible && !pending) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center${visible ? "" : " invisible pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={() => !pending && onDismiss()}
      />

      <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 max-h-[90dvh] overflow-y-auto safe-area-bottom">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-hairline)] sticky top-0 bg-[var(--color-surface)] z-10">
          <h2 id="modal-title" className="title text-[var(--color-ink)]">
            {mode === "create" ? "Add Transaction" : "Edit Transaction"}
          </h2>
          <button
            onClick={() => !pending && onDismiss()}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form key={formKey} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="id" value={transaction?.id} />
          )}

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

          <div>
            <label htmlFor="tx-amount" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Amount (₹)
            </label>
            <input
              ref={amountRef}
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

          <div>
            <label htmlFor="tx-account" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              Account
            </label>
            <select
              id="tx-account"
              name="accountId"
              defaultValue={defaultAccountId}
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.lastFour ? ` ••${a.lastFour}` : ""}
                </option>
              ))}
            </select>
            {err("accountId") && <p className="caption text-[var(--color-error)] mt-1">{err("accountId")}</p>}
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
              className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {err("transactionDate") && <p className="caption text-[var(--color-error)] mt-1">{err("transactionDate")}</p>}
          </div>

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

          {mode === "edit" && transaction && (
            <>
              <TransactionSplitEditor
                transactionId={transaction.id}
                totalAmount={Number(transaction.amount)}
                categories={categories}
                type={type}
                initialSplits={initialSplits}
                onChange={handleSplitsChange}
                onEnabledChange={setSplitsEnabled}
              />
              {shouldManageSplits && (
                <>
                  <input type="hidden" name="manageSplits" value="on" />
                  <input
                    type="hidden"
                    name="splitsJson"
                    value={JSON.stringify(splitsEnabled ? splits : [])}
                  />
                </>
              )}
            </>
          )}

          {state && !state.success && !state.errors && (
            <p className="caption text-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2 rounded-[var(--radius-md)]">
              {state.message}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => !pending && onDismiss()}
                className="flex-1 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] text-[var(--color-ink-secondary)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="tx-submit-btn"
                className="flex-1 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] active:scale-[0.97] transition-all"
              >
                {mode === "create" ? "Add Transaction" : "Save Changes"}
              </button>
            </div>

            {mode === "create" && (
              <button
                type="submit"
                onClick={() => {
                  addAnotherRef.current = true;
                }}
                className="w-full py-2 text-[var(--color-primary)] body-sm font-medium hover:underline"
              >
                Save & add another
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function TransactionFormModal({
  open,
  onClose,
  onDismiss,
  categories,
  accounts,
  mode,
  transaction,
}: TransactionFormModalProps) {
  const [mounted, setMounted] = useState(open);
  const handleDismiss = onDismiss ?? onClose;

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const handleFinished = useCallback(() => {
    setMounted(false);
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  return (
    <TransactionFormModalContent
      key={mode === "edit" ? transaction?.id : "create"}
      visible={open}
      onDismiss={handleDismiss}
      onFinished={handleFinished}
      categories={categories}
      accounts={accounts}
      mode={mode}
      transaction={transaction}
    />
  );
}
