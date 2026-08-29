"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  AlertTriangle,
  Sparkles,
  History,
  ArrowRight,
  RotateCcw,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { commitImportAction } from "@/actions/import";
import type { AnalyzedTransaction } from "@/actions/import";
import type { Category } from "@/types/finance";

interface ImportReviewTableProps {
  fileName: string;
  initialTransactions: AnalyzedTransaction[];
  categories: Category[];
  duplicateCount: number;
  statementSource?: string;
  onReset: () => void;
}

export function ImportReviewTable({
  fileName,
  initialTransactions,
  categories,
  duplicateCount,
  statementSource,
  onReset,
}: ImportReviewTableProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<AnalyzedTransaction[]>(initialTransactions);
  const [filterMode, setFilterMode] = useState<"ALL" | "SELECTED" | "DUPLICATES">("ALL");
  const [isCommitting, setIsCommitting] = useState(false);

  const toggleSelectAll = (select: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const deselectDuplicates = () => {
    setTransactions((prev) =>
      prev.map((t) => (t.duplicateInfo.isDuplicate ? { ...t, selected: false } : t))
    );
    toast.info("Duplicates deselected.");
  };

  const toggleRow = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateCategory = (id: string, categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              categorization: {
                ...t.categorization,
                categoryId: category.id,
                categoryName: category.name,
                confidence: 1.0, // manually verified
                matchType: "RULE",
              },
            }
          : t
      )
    );
  };

  const selectedList = transactions.filter((t) => t.selected);
  const selectedExpenses = selectedList
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const selectedIncome = selectedList
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const displayedTransactions = transactions.filter((t) => {
    if (filterMode === "SELECTED") return t.selected;
    if (filterMode === "DUPLICATES") return t.duplicateInfo.isDuplicate;
    return true;
  });

  const handleCommit = async () => {
    if (selectedList.length === 0) {
      toast.error("Please select at least one transaction to import.");
      return;
    }

    setIsCommitting(true);
    try {
      const response = await commitImportAction({
        fileName,
        source: statementSource?.toLowerCase().includes("credit card")
          ? "Credit Card Statement"
          : "Bank Statement",
        isCreditCard: statementSource?.toLowerCase().includes("credit card"),
        totalDuplicatesDetected: duplicateCount,
        transactions: selectedList.map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          categoryId: t.categorization.categoryId,
          paymentMethod: t.paymentMethod,
          merchantName: t.merchantName,
          transactionKind: t.transactionKind,
          excludeFromTotals: t.excludeFromTotals,
        })),
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/transactions");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("An error occurred during import.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-[var(--color-ink)]">{fileName}</span>
              <span className="eyebrow text-[var(--color-ink-muted)] px-2.5 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
                {transactions.length} rows parsed
              </span>
            </div>
            <p className="caption text-[var(--color-ink-muted)] mt-1">
              Review categories, resolve any flagged duplicates, and confirm the batch.
            </p>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] caption font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Upload Different File
          </button>
        </div>

        {duplicateCount > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-amber-200">
            <div className="flex items-center gap-2 text-[var(--color-warning)] body-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>{duplicateCount} suspected duplicate(s)</strong> detected from earlier records.
              </span>
            </div>
            <button
              onClick={deselectDuplicates}
              className="caption font-semibold text-[var(--color-warning)] hover:underline flex-shrink-0"
            >
              Deselect All Duplicates
            </button>
          </div>
        )}

        {/* Filter & Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--color-hairline)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSelectAll(true)}
              className="flex items-center gap-1 caption text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              <CheckSquare className="w-4 h-4" /> Select All
            </button>
            <span className="text-[var(--color-hairline)]">|</span>
            <button
              onClick={() => toggleSelectAll(false)}
              className="flex items-center gap-1 caption text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              <Square className="w-4 h-4" /> Deselect All
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex rounded-[var(--radius-md)] border border-[var(--color-hairline)] overflow-hidden bg-[var(--color-canvas-soft)] p-0.5">
            {[
              { id: "ALL", label: `All (${transactions.length})` },
              { id: "SELECTED", label: `Selected (${selectedList.length})` },
              { id: "DUPLICATES", label: `Duplicates (${duplicateCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as typeof filterMode)}
                className={`px-3 py-1 text-[13px] font-medium rounded-[var(--radius-xs)] transition-colors ${
                  filterMode === tab.id
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
                <th className="w-10 px-4 py-3 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left eyebrow text-[var(--color-ink-muted)] uppercase">Date</th>
                <th className="px-4 py-3 text-left eyebrow text-[var(--color-ink-muted)] uppercase">Description</th>
                <th className="px-4 py-3 text-left eyebrow text-[var(--color-ink-muted)] uppercase">Category</th>
                <th className="px-4 py-3 text-left eyebrow text-[var(--color-ink-muted)] uppercase">Match Confidence</th>
                <th className="px-4 py-3 text-right eyebrow text-[var(--color-ink-muted)] uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {displayedTransactions.map((tx) => {
                const isDup = tx.duplicateInfo.isDuplicate;
                const filteredCats = categories.filter((c) => c.type === tx.type);
                const confidencePct = Math.round(tx.categorization.confidence * 100);

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      !tx.selected
                        ? "opacity-40 bg-[var(--color-canvas-soft)]/50"
                        : isDup
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : "hover:bg-[var(--color-canvas-soft)]"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        onChange={() => toggleRow(tx.id)}
                        className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 caption text-[var(--color-ink-muted)] whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Description & Method */}
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <p className="body-sm text-[var(--color-ink)] font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tx.paymentMethod && (
                          <span className="caption text-[var(--color-ink-faint)] text-[12px]">
                            {tx.paymentMethod}
                          </span>
                        )}
                        {isDup && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            <AlertTriangle className="w-3 h-3" /> Duplicate
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category Selector */}
                    <td className="px-4 py-3.5">
                      <select
                        value={tx.categorization.categoryId}
                        onChange={(e) => updateCategory(tx.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] caption font-medium focus:outline-none focus:border-[var(--color-primary)] transition-colors min-w-[150px]"
                      >
                        {filteredCats.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Match Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] text-[12px] font-medium ${
                          tx.categorization.matchType === "RULE"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : tx.categorization.matchType === "HISTORY"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : tx.categorization.matchType === "AI_FALLBACK"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {tx.categorization.matchType === "RULE" && <Check className="w-3 h-3 text-green-600" />}
                        {tx.categorization.matchType === "HISTORY" && <History className="w-3 h-3 text-blue-600" />}
                        {tx.categorization.matchType === "AI_FALLBACK" && <Sparkles className="w-3 h-3 text-purple-600" />}
                        {confidencePct}%{" "}
                        {tx.categorization.matchType === "RULE"
                          ? "Rule match"
                          : tx.categorization.matchType === "HISTORY"
                          ? "Past match"
                          : tx.categorization.matchType === "AI_FALLBACK"
                          ? "AI match"
                          : "Default"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`body-sm font-semibold ${
                          tx.type === "INCOME" ? "text-[var(--color-income)]" : "text-[var(--color-error)]"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Commit Bar */}
      <div className="sticky bottom-4 z-20 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-4 shadow-level-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Selected for Import</p>
            <p className="text-xl font-bold text-[var(--color-ink)]">{selectedList.length} transactions</p>
          </div>
          {selectedIncome > 0 && (
            <div className="hidden sm:block border-l border-[var(--color-hairline)] pl-4">
              <p className="caption text-[var(--color-ink-muted)]">Total Income</p>
              <p className="body-sm body-tabular text-[var(--color-income)]">+{formatCurrency(selectedIncome)}</p>
            </div>
          )}
          {selectedExpenses > 0 && (
            <div className="hidden sm:block border-l border-[var(--color-hairline)] pl-4">
              <p className="caption text-[var(--color-ink-muted)]">Total Expenses</p>
              <p className="body-sm font-semibold text-[var(--color-error)]">-{formatCurrency(selectedExpenses)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] caption font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={isCommitting || selectedList.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white font-medium text-[15px] hover:bg-[var(--color-primary-active)] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database…
              </>
            ) : (
              <>
                Confirm & Import {selectedList.length} Transactions
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
