import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import type { SerializedTransaction } from "@/types/finance";

interface RecentTransactionsProps {
  transactions: SerializedTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-hairline)]">
        <h2 className="title text-[var(--color-ink)]">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="caption text-[var(--color-primary)] hover:text-[var(--color-primary-active)] flex items-center gap-1 font-medium"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="body-sm text-[var(--color-ink-muted)]">No transactions yet.</p>
          <p className="caption text-[var(--color-ink-faint)] mt-1">
            Add your first transaction to start tracking.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-active)] transition-colors"
          >
            Add Transaction
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-hairline)]">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-[var(--color-canvas-soft)] transition-colors">
              <div
                className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 text-base ${
                  t.type === "INCOME" ? "bg-[var(--color-income-bg)]" : "bg-[var(--color-expense-bg)]"
                }`}
              >
                {t.category.icon || (t.type === "INCOME" ? "💰" : "💸")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-sm text-[var(--color-ink)] font-medium truncate">{t.description}</p>
                <p className="caption text-[var(--color-ink-faint)] truncate">
                  {t.category.name} · {formatDate(t.transactionDate)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                {t.type === "INCOME" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--color-income)] hidden sm:block" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--color-ink-muted)] hidden sm:block" />
                )}
                <span
                  className={`body-sm body-tabular font-normal whitespace-nowrap ${
                    t.type === "INCOME"
                      ? "text-[var(--color-income)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
