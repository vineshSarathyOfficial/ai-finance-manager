import { StatCard } from "@/components/ui/StatCard";
import { TrendingUp, TrendingDown, PiggyBank, Percent, ArrowLeftRight } from "lucide-react";

interface CashFlowHeroProps {
  summary: {
    incomeThisMonth: number;
    expensesThisMonth: number;
    savingsThisMonth: number;
    savingsRate: number;
    netCashFlow: number;
  };
  expenseChange?: number;
}

export function CashFlowHero({ summary, expenseChange }: CashFlowHeroProps) {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          label="Income"
          value={summary.incomeThisMonth}
          format="currency"
          variant="income"
          icon={TrendingUp}
          href={`/transactions?type=INCOME&dateFrom=${dateFrom}&dateTo=${dateTo}`}
        />
        <StatCard
          label="Expenses"
          value={summary.expensesThisMonth}
          format="currency"
          variant="expense"
          icon={TrendingDown}
          change={expenseChange !== undefined ? { value: expenseChange, label: "vs last month" } : undefined}
          href={`/transactions?type=EXPENSE&dateFrom=${dateFrom}&dateTo=${dateTo}`}
        />
        <StatCard
          label="Savings"
          value={summary.savingsThisMonth}
          format="currency"
          variant={summary.savingsThisMonth >= 0 ? "income" : "expense"}
          icon={PiggyBank}
        />
        <StatCard
          label="Savings Rate"
          value={summary.savingsRate}
          format="percent"
          variant="primary"
          icon={Percent}
        />
      </div>

      <div className="bg-[var(--color-canvas-soft)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-3 sm:p-5 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-hairline)] flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-[var(--color-ink-muted)]" />
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Net cash flow (all time)</p>
            <p className="body-tabular text-[var(--color-ink)]">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(summary.netCashFlow)}
            </p>
          </div>
        </div>
        <p className="caption-sm text-[var(--color-ink-faint)] hidden sm:block max-w-xs text-right">
          Excludes transfers &amp; CC payments
        </p>
      </div>
    </div>
  );
}
