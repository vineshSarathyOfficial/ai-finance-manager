import { formatCurrency } from "@/lib/utils";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

interface InsightHeroProps {
  summaryText: string;
  snapshot: PeriodSnapshot;
}

export function InsightHero({ summaryText, snapshot }: InsightHeroProps) {
  const periodWord =
    snapshot.period === "daily" ? "today" : snapshot.period === "weekly" ? "this week" : "this month";

  return (
    <div className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] p-4 sm:p-5 text-white shadow-level-1">
      <p className="caption text-white/70 uppercase tracking-wide mb-1">
        {snapshot.period === "daily" ? "Daily" : snapshot.period === "weekly" ? "Weekly" : "Monthly"} Summary
      </p>
      <p className="title text-white mb-3 leading-snug">{summaryText}</p>
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="caption text-white/60">Spent {periodWord}</p>
          <p className="heading-2 tabular-nums">{formatCurrency(snapshot.expenses)}</p>
        </div>
        {snapshot.income > 0 && (
          <div>
            <p className="caption text-white/60">Income</p>
            <p className="heading-2 tabular-nums">{formatCurrency(snapshot.income)}</p>
          </div>
        )}
        <div>
          <p className="caption text-white/60">Net</p>
          <p className="heading-2 tabular-nums">{formatCurrency(snapshot.netCashFlow)}</p>
        </div>
      </div>
    </div>
  );
}
