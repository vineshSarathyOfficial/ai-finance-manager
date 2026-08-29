import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  summary: {
    totalBalance: number;
    incomeThisMonth: number;
    expensesThisMonth: number;
    savingsThisMonth: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const savingsRate =
    summary.incomeThisMonth > 0
      ? Math.round((summary.savingsThisMonth / summary.incomeThisMonth) * 100)
      : 0;

  const rateColor =
    savingsRate >= 20
      ? "text-[var(--color-income)]"
      : savingsRate >= 0
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-error)]";

  const rateIconBg =
    savingsRate >= 20
      ? "bg-[var(--color-income-bg)]"
      : savingsRate >= 0
      ? "bg-[var(--color-warning-bg)]"
      : "bg-[var(--color-error-bg)]";

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-center justify-between mb-3">
          <span className="caption text-[var(--color-ink-muted)]">Total Balance</span>
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-canvas-soft)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
        </div>
        <p className={cn("display-md body-tabular", summary.totalBalance < 0 ? "text-[var(--color-error)]" : "text-[var(--color-ink)]")}>
          {formatCurrency(Math.abs(summary.totalBalance))}
          {summary.totalBalance < 0 && <span className="caption text-[var(--color-ink-muted)] ml-1">(deficit)</span>}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-center justify-between mb-3">
          <span className="caption text-[var(--color-ink-muted)]">Income This Month</span>
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-income-bg)] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[var(--color-income)]" />
          </div>
        </div>
        <p className="display-md body-tabular text-[var(--color-ink)]">
          {formatCurrency(summary.incomeThisMonth)}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-center justify-between mb-3">
          <span className="caption text-[var(--color-ink-muted)]">Expenses This Month</span>
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />
          </div>
        </div>
        <p className="display-md body-tabular text-[var(--color-ink)]">
          {formatCurrency(summary.expensesThisMonth)}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-center justify-between mb-3">
          <span className="caption text-[var(--color-ink-muted)]">Savings This Month</span>
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-[var(--color-accent-teal)]" />
          </div>
        </div>
        <p className={cn("display-md body-tabular", summary.savingsThisMonth < 0 ? "text-[var(--color-error)]" : "text-[var(--color-ink)]")}>
          {formatCurrency(Math.abs(summary.savingsThisMonth))}
          {summary.savingsThisMonth < 0 && <span className="caption text-[var(--color-ink-muted)] ml-1">(deficit)</span>}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-center justify-between mb-3">
          <span className="caption text-[var(--color-ink-muted)]">Savings Rate</span>
          <div className={cn("w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center", rateIconBg)}>
            <Percent className={cn("w-4 h-4", rateColor)} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className={cn("display-md body-tabular", rateColor)}>
            {savingsRate}%
          </p>
          <p className="caption text-[var(--color-ink-faint)] mb-0.5">
            {savingsRate >= 20 ? "Great" : savingsRate >= 0 ? "OK" : "Deficit"}
          </p>
        </div>
        <div className="mt-2 h-1 bg-[var(--color-canvas-soft)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
              background: savingsRate >= 20 ? "var(--color-income)" : savingsRate >= 0 ? "var(--color-warning)" : "var(--color-error)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
