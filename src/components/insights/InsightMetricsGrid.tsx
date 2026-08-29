import { ArrowDownLeft, ArrowUpRight, Hash, Wallet } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

interface InsightMetricsGridProps {
  snapshot: PeriodSnapshot;
}

export function InsightMetricsGrid({ snapshot }: InsightMetricsGridProps) {
  const avgDaily =
    snapshot.period === "weekly" && snapshot.dailyTrend.length > 0
      ? Math.round(
          snapshot.dailyTrend.reduce((s, d) => s + d.expenses, 0) / snapshot.dailyTrend.length
        )
      : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <StatCard label="Spending" value={snapshot.expenses} format="currency" variant="expense" icon={ArrowUpRight} />
      <StatCard label="Income" value={snapshot.income} format="currency" variant="income" icon={ArrowDownLeft} />
      <StatCard
        label="Net cash flow"
        value={snapshot.netCashFlow}
        format="currency"
        variant={snapshot.netCashFlow >= 0 ? "income" : "expense"}
        icon={Wallet}
      />
      <StatCard label="Transactions" value={snapshot.transactionCount} format="number" icon={Hash} />
      {avgDaily !== null && (
        <StatCard label="Avg daily spend" value={avgDaily} format="currency" className="col-span-2 lg:col-span-1" />
      )}
      {snapshot.savingsRate > 0 && snapshot.period === "monthly" && (
        <StatCard label="Savings rate" value={snapshot.savingsRate} format="percent" variant="primary" />
      )}
      {snapshot.topCategory && (
        <StatCard
          label="Top category"
          value={`${snapshot.topCategory.icon ?? ""} ${snapshot.topCategory.name}`}
          format="text"
          className="col-span-2"
        />
      )}
    </div>
  );
}
