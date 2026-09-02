import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TransactionFilters } from "@/lib/validations/transaction";

interface TransactionTotalsBarProps {
  totalExpenses: number;
  transactionCount: number;
  filters: TransactionFilters;
}

function filterContextLabel(filters: TransactionFilters): string | null {
  if (filters.dateFrom && filters.dateTo) {
    const from = new Date(filters.dateFrom).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const to = new Date(filters.dateTo).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${from} – ${to}`;
  }
  if (filters.dateFrom) {
    return `From ${new Date(filters.dateFrom).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }
  if (filters.dateTo) {
    return `Until ${new Date(filters.dateTo).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }
  return null;
}

export function TransactionTotalsBar({
  totalExpenses,
  transactionCount,
  filters,
}: TransactionTotalsBarProps) {
  if (filters.type === "INCOME") return null;

  const dateLabel = filterContextLabel(filters);
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.type && filters.type !== "ALL") ||
    Boolean(filters.categoryId) ||
    Boolean(filters.accountId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.merchant) ||
    Boolean(filters.paymentMethod) ||
    (filters.transactionKind && filters.transactionKind !== "ALL") ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    Boolean(filters.excludeTransfers);

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-card)] px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden sm:flex w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] items-center justify-center flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />
        </div>
        <div className="min-w-0">
          <p className="caption text-[var(--color-ink-muted)]">
            Total expenses
            {hasActiveFilters ? " (filtered)" : ""}
          </p>
          {dateLabel && (
            <p className="caption text-[var(--color-ink-faint)] truncate">{dateLabel}</p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg sm:text-xl font-semibold body-tabular text-[var(--color-ink)]">
          {formatCurrency(totalExpenses)}
        </p>
        <p className="caption text-[var(--color-ink-faint)] hidden sm:block">
          {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
