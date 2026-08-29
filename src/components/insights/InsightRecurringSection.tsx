import { formatCurrency } from "@/lib/utils";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

interface InsightRecurringSectionProps {
  items: PeriodSnapshot["recurringItems"];
  total: number;
}

export function InsightRecurringSection({ items, total }: InsightRecurringSectionProps) {
  if (items.length === 0 && total === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="title text-[var(--color-ink)]">Recurring & subscriptions</h2>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4">
        <p className="caption text-[var(--color-ink-muted)] mb-3">
          Est. monthly recurring: {formatCurrency(total)}
        </p>
        {items.length > 0 && (
          <div className="divide-y divide-[var(--color-hairline)]">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="body-sm text-[var(--color-ink)]">{item.name}</span>
                <span className="body-sm tabular-nums text-[var(--color-ink-muted)]">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
