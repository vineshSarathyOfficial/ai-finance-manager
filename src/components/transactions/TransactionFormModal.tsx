"use client";

import { useState, useActionState, useEffect, useRef, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, X } from "lucide-react";
import { createTransactionAction, updateTransactionAction, getTransactionSplitsAction } from "@/actions/transactions";
import { formatDateInput, cn } from "@/lib/utils";
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

const fieldInput =
  "w-full min-h-[48px] px-3.5 py-3 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] text-base placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors";

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
  const defaultAccountId =
    transaction?.accountId ??
    accounts.find((a) => a.isDefault)?.id ??
    accounts[0]?.id ??
    "";
  const [categoryId, setCategoryId] = useState(() => transaction?.categoryId ?? "");
  const [paymentMethod, setPaymentMethod] = useState(() => transaction?.paymentMethod ?? "");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [showNotes, setShowNotes] = useState(() => !!transaction?.notes);
  const [saving, setSaving] = useState(false);
  const handleSplitsChange = useCallback((next: { categoryId: string; amount: number }[]) => {
    setSplits(next);
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);
  const shouldManageSplits = splitsEnabled || initialSplits.length > 0;

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 640px)").matches) return;
    amountRef.current?.focus();
  }, [formKey]);

  useEffect(() => {
    setCategoryId((prev) => {
      if (prev && filteredCategories.some((c) => c.id === prev)) return prev;
      return filteredCategories[0]?.id ?? "";
    });
  }, [type, filteredCategories]);

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
      setSaving(false);
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

    setSaving(false);

    if (addAnotherRef.current && mode === "create") {
      addAnotherRef.current = false;
      setType("EXPENSE");
      setPaymentMethod("");
      setAccountId(
        accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id ?? ""
      );
      setShowNotes(false);
      setFormKey((k) => k + 1);
      return;
    }

    onFinished();
  }, [state, onFinished, mode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!accountId) {
      toast.error("Please select an account");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("categoryId", categoryId);
    formData.set("paymentMethod", paymentMethod);
    formData.set("accountId", accountId);

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
    setSaving(true);

    if (!addAnotherRef.current) {
      onDismiss();
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const err = (field: string) =>
    state && !state.success ? state.errors?.[field]?.[0] : undefined;

  if (!visible && !saving) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        !visible && "invisible pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !saving && onDismiss()}
      />

      <div className="relative w-full sm:max-w-md flex flex-col max-h-[92dvh] sm:max-h-[90dvh] bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2">
        <div className="flex-shrink-0 pt-2 sm:pt-0">
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[var(--color-hairline)] sm:hidden" aria-hidden />
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--color-hairline)]">
            <h2 id="modal-title" className="title text-[var(--color-ink)]">
              {mode === "create" ? "Add Transaction" : "Edit Transaction"}
            </h2>
            <button
              type="button"
              onClick={() => !saving && onDismiss()}
              className="w-10 h-10 -mr-1 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] active:bg-[var(--color-canvas-soft)] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          {mode === "edit" && <input type="hidden" name="id" value={transaction?.id} />}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="accountId" value={accountId} />

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 scroll-pb-4">
            <div>
              <div className="flex rounded-[var(--radius-md)] border border-[var(--color-hairline)] overflow-hidden min-h-[48px]">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex-1 py-3 text-base font-medium transition-colors active:scale-[0.99]",
                      type === t
                        ? t === "EXPENSE"
                          ? "bg-red-50 text-[var(--color-error)]"
                          : "bg-[var(--color-income-bg)] text-[var(--color-income)]"
                        : "bg-[var(--color-surface)] text-[var(--color-ink-muted)]"
                    )}
                  >
                    {t === "EXPENSE" ? "Expense" : "Income"}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center py-1">
              <label htmlFor="tx-amount" className="sr-only">
                Amount
              </label>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl sm:text-xl text-[var(--color-ink-muted)] font-medium">₹</span>
                <input
                  ref={amountRef}
                  id="tx-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  defaultValue={transaction?.amount?.toString()}
                  placeholder="0"
                  required
                  enterKeyHint="next"
                  className="w-full max-w-[220px] text-center text-4xl sm:text-3xl font-semibold tabular-nums bg-transparent border-0 border-b-2 border-[var(--color-hairline)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-0 py-2 text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]"
                />
              </div>
              {err("amount") && (
                <p className="caption text-[var(--color-error)] mt-2">{err("amount")}</p>
              )}
            </div>

            <div>
              <label htmlFor="tx-desc" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
                Description
              </label>
              <input
                id="tx-desc"
                name="description"
                type="text"
                defaultValue={transaction?.description}
                placeholder="e.g. Swiggy, rent, salary"
                required
                enterKeyHint="done"
                autoComplete="off"
                className={fieldInput}
              />
              {err("description") && (
                <p className="caption text-[var(--color-error)] mt-1.5">{err("description")}</p>
              )}
            </div>

            <div>
              <label htmlFor="tx-category" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
                Category
              </label>
              <select
                id="tx-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className={fieldInput}
              >
                <option value="">Select a category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
              {err("categoryId") && (
                <p className="caption text-[var(--color-error)] mt-1.5">{err("categoryId")}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div className="min-w-0 w-full">
                <label htmlFor="tx-date" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
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
                  className={cn(fieldInput, "native-date-input w-full min-w-0 max-w-full")}
                />
                {err("transactionDate") && (
                  <p className="caption text-[var(--color-error)] mt-1.5">{err("transactionDate")}</p>
                )}
              </div>

              <div className="min-w-0 w-full">
                <label htmlFor="tx-payment" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
                  Payment
                </label>
                <select
                  id="tx-payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={cn(fieldInput, "w-full min-w-0 max-w-full")}
                >
                  <option value="">None</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-2 block">
                Account
              </label>
              {accounts.length <= 4 ? (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccountId(a.id)}
                      className={cn(
                        "inline-flex items-center min-h-[44px] px-3.5 py-2.5 rounded-[var(--radius-full)] border text-sm font-medium transition-colors active:scale-[0.98]",
                        accountId === a.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]"
                          : "border-[var(--color-hairline)] text-[var(--color-ink-secondary)]"
                      )}
                    >
                      {a.name}
                      {a.lastFour ? ` ••${a.lastFour}` : ""}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  id="tx-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className={fieldInput}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.lastFour ? ` ••${a.lastFour}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {err("accountId") && (
                <p className="caption text-[var(--color-error)] mt-1.5">{err("accountId")}</p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="w-full flex items-center justify-between min-h-[44px] px-1 text-[var(--color-ink-secondary)] body-sm font-medium"
              >
                <span>Add notes</span>
                <span className="flex items-center gap-1.5 text-[var(--color-ink-faint)] caption font-normal">
                  optional
                  <ChevronDown
                    className={cn("w-4 h-4 transition-transform", showNotes && "rotate-180")}
                  />
                </span>
              </button>
              {showNotes && (
                <div className="pt-1">
                  <label htmlFor="tx-notes" className="sr-only">
                    Notes
                  </label>
                  <textarea
                    id="tx-notes"
                    name="notes"
                    rows={2}
                    defaultValue={transaction?.notes ?? ""}
                    placeholder="Any additional notes…"
                    className={cn(fieldInput, "resize-none min-h-[80px]")}
                  />
                </div>
              )}
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
              <p className="caption text-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2.5 rounded-[var(--radius-md)]">
                {state.message}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] space-y-2">
            <button
              type="submit"
              id="tx-submit-btn"
              className="w-full min-h-[52px] rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white text-base font-semibold hover:bg-[var(--color-primary-active)] active:scale-[0.98] transition-all"
            >
              {mode === "create" ? "Add Transaction" : "Save Changes"}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !saving && onDismiss()}
                className="flex-1 min-h-[44px] rounded-[var(--radius-full)] border border-[var(--color-hairline)] text-[var(--color-ink-secondary)] text-base font-medium active:bg-[var(--color-canvas-soft)] transition-colors"
              >
                Cancel
              </button>
              {mode === "create" && (
                <button
                  type="submit"
                  onClick={() => {
                    addAnotherRef.current = true;
                  }}
                  className="flex-1 min-h-[44px] rounded-[var(--radius-full)] text-[var(--color-primary)] text-base font-medium active:bg-[var(--color-primary-bg-subdued)] transition-colors"
                >
                  + Another
                </button>
              )}
            </div>
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
