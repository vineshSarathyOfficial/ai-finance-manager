import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SnapshotTransaction } from "@/lib/finance/snapshots";

interface InsightTransactionsProps {
  transactions: SnapshotTransaction[];
  dateFrom: string;
  dateTo: string;
}

export function InsightTransactions({ transactions, dateFrom, dateTo }: InsightTransactionsProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="title text-[var(--color-ink)]">Transactions</h2>
        <Link
          href={`/transactions?dateFrom=${dateFrom.slice(0, 10)}&dateTo=${dateTo.slice(0, 10)}`}
          className="caption text-[var(--color-primary)] hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] divide-y divide-[var(--color-hairline)] overflow-hidden">
        {transactions.slice(0, 8).map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="body-sm font-medium text-[var(--color-ink)] truncate">{tx.description}</p>
              <p className="caption text-[var(--color-ink-faint)]">
                {tx.categoryIcon} {tx.categoryName} · {formatDate(tx.transactionDate)}
              </p>
            </div>
            <p
              className={`body-sm body-tabular font-medium flex-shrink-0 ${
                tx.type === "INCOME" ? "text-[var(--color-income)]" : "text-[var(--color-ink)]"
              }`}
            >
              {tx.type === "INCOME" ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
