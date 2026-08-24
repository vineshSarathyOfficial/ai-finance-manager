"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransactionAction } from "@/actions/transactions";
import { TransactionFormModal } from "./TransactionFormModal";
import type { Category, SerializedTransaction } from "@/types/finance";
import type { TransactionFilters } from "@/lib/validations/transaction";


interface TransactionTableProps {
  transactions: SerializedTransaction[];
  categories: Category[];
  filters: TransactionFilters;
  total: number;
  pageCount: number;
}

export function TransactionTable({
  transactions,
  categories,
  filters,
  total,
  pageCount,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editTarget, setEditTarget] = useState<SerializedTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigatePage = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteTransactionAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (result?.success) toast.success(result.message);
    else toast.error(result?.message ?? "Delete failed.");
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] px-6 py-16 text-center shadow-level-1">
        <p className="title text-[var(--color-ink-muted)]">No transactions found</p>
        <p className="caption text-[var(--color-ink-faint)] mt-1">
          {filters.search || filters.type || filters.categoryId
            ? "Try adjusting your filters."
            : "Add your first transaction to start tracking your finances."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
              {[
                { label: "Date", key: "transactionDate" },
                { label: "Description", key: null },
                { label: "Category", key: null },
                { label: "Payment", key: null },
                { label: "Amount", key: "amount" },
                { label: "", key: null },
              ].map(({ label, key }) => (
                <th
                  key={label || "actions"}
                  className="px-4 py-3 text-left eyebrow text-[var(--color-ink-muted)] uppercase"
                >
                  {key ? (
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set("sortBy", key);
                        params.set(
                          "sortOrder",
                          filters.sortBy === key && filters.sortOrder === "desc" ? "asc" : "desc"
                        );
                        router.push(`${pathname}?${params.toString()}`);
                      }}
                      className="flex items-center gap-1 hover:text-[var(--color-ink)] transition-colors"
                    >
                      {label}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  ) : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hairline)]">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-[var(--color-canvas-soft)] transition-colors group">
                <td className="px-4 py-3.5 caption text-[var(--color-ink-muted)] whitespace-nowrap">
                  {formatDate(t.transactionDate)}
                </td>
                <td className="px-4 py-3.5 body-sm text-[var(--color-ink)] max-w-[200px] truncate">
                  {t.description}
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
                    className={`body-sm font-semibold ${
                      t.type === "INCOME"
                        ? "text-[var(--color-accent-green)]"
                        : "text-[var(--color-error)]"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTarget(t)}
                      className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label="Edit transaction"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-red-50 hover:text-[var(--color-error)] transition-colors"
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

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4 shadow-level-1"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-base flex-shrink-0 ${
                    t.type === "INCOME" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {t.category.icon || "💸"}
                </div>
                <div className="min-w-0">
                  <p className="body-sm text-[var(--color-ink)] font-medium truncate">{t.description}</p>
                  <p className="caption text-[var(--color-ink-faint)]">
                    {t.category.name} · {formatDate(t.transactionDate)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`body-sm font-semibold ${
                    t.type === "INCOME" ? "text-[var(--color-accent-green)]" : "text-[var(--color-error)]"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                </p>
                {t.paymentMethod && (
                  <p className="caption text-[var(--color-ink-faint)] mt-0.5">{t.paymentMethod}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-hairline)]">
              <button
                onClick={() => setEditTarget(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] caption text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => setDeleteId(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] caption text-[var(--color-error)] hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] px-4 py-3 shadow-level-1">
          <span className="caption text-[var(--color-ink-muted)]">
            Page {filters.page} of {pageCount} · {total} total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigatePage(filters.page - 1)}
              disabled={filters.page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => navigatePage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] caption font-medium transition-colors ${
                    p === filters.page
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => navigatePage(filters.page + 1)}
              disabled={filters.page >= pageCount}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <TransactionFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          categories={categories}
          mode="edit"
          transaction={editTarget}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-level-2 p-6 max-w-sm w-full mx-4">
            <h3 className="title text-[var(--color-ink)] mb-2">Delete Transaction</h3>
            <p className="body-sm text-[var(--color-ink-muted)]">
              This action cannot be undone. The transaction will be permanently removed.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-delete-btn"
                className="flex-1 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-error)] text-white body-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
