"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Receipt, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransactionAction, bulkDeleteTransactionsAction } from "@/actions/transactions";
import { TransactionFormModal } from "./TransactionFormModal";
import {
  TransactionColumnHeader,
  DateColumnFilter,
  TextColumnFilter,
  CategoryColumnFilter,
  PaymentColumnFilter,
  AmountColumnFilter,
  TypeColumnFilter,
} from "./TransactionColumnHeader";
import type { Category, SerializedTransaction, Account } from "@/types/finance";
import type { OptimisticTransaction } from "@/lib/transactions/optimistic";
import type { TransactionFilters } from "@/lib/validations/transaction";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: OptimisticTransaction[];
  categories: Category[];
  accounts: Account[];
  filters: TransactionFilters;
  total: number;
  pageCount: number;
  onTransactionDeleted?: (transaction: OptimisticTransaction) => void;
  onTransactionRestored?: (transaction: OptimisticTransaction) => void;
  onBulkDeleted?: (transactions: OptimisticTransaction[]) => void;
}

export function TransactionTable({
  transactions,
  categories,
  accounts,
  filters,
  total,
  pageCount,
  onTransactionDeleted,
  onTransactionRestored,
  onBulkDeleted,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editTarget, setEditTarget] = useState<OptimisticTransaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OptimisticTransaction | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pageIds = transactions.map((t) => t.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const pushFilters = useCallback(
    (updates: Partial<TransactionFilters>) => {
      const params = new URLSearchParams();
      const merged = { ...filters, ...updates, page: 1 };

      Object.entries(merged).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === false) return;
        if (key === "type" && value === "ALL") return;
        if (key === "transactionKind" && value === "ALL") return;
        if (key === "sortBy" && value === "transactionDate") return;
        if (key === "sortOrder" && value === "desc") return;
        if (key === "page" && value === 1) return;
        if (key === "pageSize" && value === 20) return;
        params.set(key, String(value));
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, pathname, router]
  );

  const handleSort = (sortBy: TransactionFilters["sortBy"]) => {
    const nextOrder =
      filters.sortBy === sortBy && filters.sortOrder === "desc" ? "asc" : "desc";
    pushFilters({ sortBy, sortOrder: nextOrder });
  };

  const navigatePage = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
    setSelectedIds(new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const isOptimisticOnly = target.id.startsWith("optimistic-");

    setDeleting(true);
    setDeleteTarget(null);
    onTransactionDeleted?.(target);

    if (isOptimisticOnly) {
      setDeleting(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
      toast.success("Transaction removed.");
      return;
    }

    const result = await deleteTransactionAction(target.id);
    setDeleting(false);

    if (result?.success) {
      toast.success(result.message);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    } else {
      onTransactionRestored?.(target);
      toast.error(result?.message ?? "Delete failed.");
    }
  };

  const handleBulkDelete = async () => {
    const targets = transactions.filter((t) => selectedIds.has(t.id));
    if (!targets.length) return;

    const serverIds = targets
      .filter((t) => !t.id.startsWith("optimistic-") && !t.isPending)
      .map((t) => t.id);

    setDeleting(true);
    setBulkDeleteOpen(false);
    onBulkDeleted?.(targets);

    if (!serverIds.length) {
      setDeleting(false);
      clearSelection();
      toast.success("Transactions removed.");
      return;
    }

    const result = await bulkDeleteTransactionsAction(serverIds);
    setDeleting(false);

    if (result?.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      for (const target of targets.filter((t) => serverIds.includes(t.id))) {
        onTransactionRestored?.(target);
      }
      toast.error(result?.message ?? "Bulk delete failed.");
    }
  };

  const kindBadge = (kind?: string) => {
    if (!kind || kind === "REGULAR") return null;
    const variants: Record<string, "muted" | "warning" | "success" | "primary"> = {
      TRANSFER: "muted",
      REFUND: "success",
      CC_PAYMENT: "primary",
      EXCLUDED: "warning",
    };
    return (
      <Badge variant={variants[kind] ?? "muted"} className="ml-1">
        {kind.replace("_", " ")}
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        description={
          filters.search || filters.type || filters.categoryId
            ? "Try adjusting your filters."
            : "Add your first transaction or import a bank statement."
        }
        action={{ label: "Import Statement", href: "/import" }}
      />
    );
  }

  return (
    <>
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
          <div className="flex items-center gap-3">
            <span className="body-sm text-[var(--color-ink)]">
              <span className="font-medium">{selectedIds.size}</span> selected on this page
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="caption text-[var(--color-primary)] hover:underline"
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-error-bg)] text-[var(--color-accent-orange-deep)] border border-[var(--color-hairline)] button-sm hover:bg-[var(--color-accent-orange)] hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete selected
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = somePageSelected && !allPageSelected;
                  }}
                  onChange={toggleSelectAllPage}
                  aria-label="Select all on page"
                  className="w-4 h-4 rounded-[var(--radius-xs)] border-[var(--color-hairline-input)] accent-[var(--color-primary)]"
                />
              </th>

              <TransactionColumnHeader
                label="Date"
                sortKey="transactionDate"
                filters={filters}
                onSort={handleSort}
                onApplyFilter={pushFilters}
                onClearFilter={() => pushFilters({ dateFrom: undefined, dateTo: undefined })}
                hasActiveFilter={!!(filters.dateFrom || filters.dateTo)}
              >
                <DateColumnFilter filters={filters} onApply={pushFilters} />
              </TransactionColumnHeader>

              <TransactionColumnHeader
                label="Description"
                sortKey="description"
                filters={filters}
                onSort={handleSort}
                onApplyFilter={pushFilters}
                onClearFilter={() => pushFilters({ search: undefined, type: undefined })}
                hasActiveFilter={!!(filters.search || (filters.type && filters.type !== "ALL"))}
              >
                <div className="space-y-2">
                  <TextColumnFilter
                    value={filters.search}
                    placeholder="Search description…"
                    onApply={(search) => pushFilters({ search })}
                  />
                  <TypeColumnFilter
                    value={filters.type}
                    onApply={(type) => pushFilters({ type })}
                  />
                </div>
              </TransactionColumnHeader>

              <TransactionColumnHeader
                label="Category"
                sortKey="categoryName"
                filters={filters}
                onSort={handleSort}
                onApplyFilter={pushFilters}
                onClearFilter={() => pushFilters({ categoryId: undefined })}
                hasActiveFilter={!!filters.categoryId}
              >
                <CategoryColumnFilter
                  categories={categories}
                  value={filters.categoryId}
                  onApply={(categoryId) => pushFilters({ categoryId })}
                />
              </TransactionColumnHeader>

              <TransactionColumnHeader
                label="Payment"
                sortKey="paymentMethod"
                filters={filters}
                onSort={handleSort}
                onApplyFilter={pushFilters}
                onClearFilter={() => pushFilters({ paymentMethod: undefined })}
                hasActiveFilter={!!filters.paymentMethod}
              >
                <PaymentColumnFilter
                  value={filters.paymentMethod}
                  onApply={(paymentMethod) => pushFilters({ paymentMethod })}
                />
              </TransactionColumnHeader>

              <TransactionColumnHeader
                label="Amount"
                sortKey="amount"
                filters={filters}
                onSort={handleSort}
                onApplyFilter={pushFilters}
                onClearFilter={() => pushFilters({ minAmount: undefined, maxAmount: undefined })}
                hasActiveFilter={filters.minAmount !== undefined || filters.maxAmount !== undefined}
              >
                <AmountColumnFilter filters={filters} onApply={pushFilters} />
              </TransactionColumnHeader>

              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hairline)]">
            {transactions.map((t) => (
              <tr
                key={t.id}
                className={cn(
                  "hover:bg-[var(--color-canvas-soft)] transition-colors group",
                  selectedIds.has(t.id) && "bg-[var(--color-primary-bg-subdued)]/40",
                  t.isPending && "opacity-70"
                )}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleRow(t.id)}
                    aria-label={`Select ${t.description}`}
                    className="w-4 h-4 rounded-[var(--radius-xs)] border-[var(--color-hairline-input)] accent-[var(--color-primary)]"
                  />
                </td>
                <td className="px-4 py-3.5 caption text-[var(--color-ink-muted)] whitespace-nowrap">
                  {formatDate(t.transactionDate)}
                </td>
                <td className="px-4 py-3.5 body-sm text-[var(--color-ink)] max-w-[200px]">
                  <span className="truncate block">{t.merchantName || t.description}</span>
                  {t.isPending && (
                    <span className="caption text-[var(--color-ink-faint)]">Saving…</span>
                  )}
                  {kindBadge((t as SerializedTransaction & { transactionKind?: string }).transactionKind)}
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)] eyebrow text-[var(--color-ink-muted)]">
                    {t.category.icon} {t.category.name}
                  </span>
                </td>
                <td className="px-4 py-3.5 caption text-[var(--color-ink-faint)]">
                  {t.paymentMethod || "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "body-sm body-tabular font-normal",
                      t.type === "INCOME" ? "text-[var(--color-income)]" : "text-[var(--color-ink)]"
                    )}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        if (!t.isPending) {
                          setEditTarget(t);
                          setEditOpen(true);
                        }
                      }}
                      disabled={t.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Edit transaction"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(t)}
                      className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)] transition-colors"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between px-1 py-0.5">
          <label className="flex items-center gap-2 body-sm text-[var(--color-ink-muted)]">
            <input
              type="checkbox"
              checked={allPageSelected}
              ref={(el) => {
                if (el) el.indeterminate = somePageSelected && !allPageSelected;
              }}
              onChange={toggleSelectAllPage}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            Select all
          </label>
          {selectedIds.size > 0 && (
            <button type="button" onClick={clearSelection} className="p-2 text-[var(--color-ink-faint)]" aria-label="Clear selection">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {transactions.map((t) => (
          <div
            key={t.id}
            className={cn(
              "bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-3 shadow-level-1",
              selectedIds.has(t.id) && "border-[var(--color-primary)] bg-[var(--color-primary-bg-subdued)]/30",
              t.isPending && "opacity-70"
            )}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={selectedIds.has(t.id)}
                onChange={() => toggleRow(t.id)}
                disabled={t.isPending}
                className="mt-1.5 w-4 h-4 flex-shrink-0 accent-[var(--color-primary)]"
                aria-label={`Select ${t.description}`}
              />
              <button
                type="button"
                onClick={() => {
                  if (!t.isPending) {
                    setEditTarget(t);
                    setEditOpen(true);
                  }
                }}
                disabled={t.isPending}
                className="flex-1 min-w-0 flex items-start justify-between gap-2 text-left disabled:cursor-default"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-sm flex-shrink-0",
                      t.type === "INCOME" ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-expense-bg)]"
                    )}
                  >
                    {t.category.icon || "💸"}
                  </div>
                  <div className="min-w-0">
                    <p className="body-sm text-[var(--color-ink)] font-medium truncate">{t.merchantName || t.description}</p>
                    <p className="caption text-[var(--color-ink-faint)] truncate">
                      {t.isPending ? "Saving… · " : ""}
                      {t.category.name} · {formatDate(t.transactionDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      "body-sm body-tabular",
                      t.type === "INCOME" ? "text-[var(--color-income)]" : "text-[var(--color-ink)]"
                    )}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </p>
                  {t.paymentMethod && (
                    <p className="caption text-[var(--color-ink-faint)] mt-0.5 max-w-[6.5rem] truncate ml-auto">
                      {t.paymentMethod}
                    </p>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-faint)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)] flex-shrink-0"
                aria-label="Delete transaction"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] px-3 sm:px-4 py-3 shadow-level-1">
          <span className="caption text-[var(--color-ink-muted)] truncate">
            {filters.page}/{pageCount} · {total}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigatePage(filters.page - 1)}
              disabled={filters.page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => navigatePage(p)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] caption font-medium transition-colors",
                    p === filters.page
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => navigatePage(filters.page + 1)}
              disabled={filters.page >= pageCount}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {editTarget && (
        <TransactionFormModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditTarget(null);
          }}
          onDismiss={() => setEditOpen(false)}
          categories={categories}
          accounts={accounts}
          mode="edit"
          transaction={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description={
          deleteTarget?.isPending || deleteTarget?.id.startsWith("optimistic-")
            ? "Remove this unsaved transaction?"
            : "This action cannot be undone. The transaction will be permanently removed."
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.size} transaction${selectedIds.size === 1 ? "" : "s"}?`}
        description="This will permanently remove all selected transactions. This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : `Delete ${selectedIds.size}`}
      />
    </>
  );
}
