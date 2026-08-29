import { formatCurrency } from "@/lib/utils";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

interface InsightBudgetSectionProps {
  budgetItems: PeriodSnapshot["budgetItems"];
}

export function InsightBudgetSection({ budgetItems }: InsightBudgetSectionProps) {
  if (budgetItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="title text-[var(--color-ink)]">Budget progress</h2>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4 space-y-3">
        {budgetItems.map((b) => (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="body-sm text-[var(--color-ink)]">
                {b.categoryIcon} {b.categoryName}
              </span>
              <span className="caption text-[var(--color-ink-muted)] tabular-nums">
                {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}
              </span>
            </div>
            <div className="h-2 bg-[var(--color-canvas-soft)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  b.isOverBudget ? "bg-[var(--color-error)]" : "bg-[var(--color-primary)]"
                }`}
                style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
