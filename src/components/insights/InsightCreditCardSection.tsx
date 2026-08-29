import { formatCurrency } from "@/lib/utils";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

interface InsightCreditCardSectionProps {
  creditCard: PeriodSnapshot["creditCard"];
}

export function InsightCreditCardSection({ creditCard }: InsightCreditCardSectionProps) {
  if (!creditCard || creditCard.totalSpend === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="title text-[var(--color-ink)]">Credit card spending</h2>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4">
        <p className="heading-2 tabular-nums text-[var(--color-ink)] mb-3">
          {formatCurrency(creditCard.totalSpend)}
        </p>
        <div className="space-y-2">
          {creditCard.cards.map((card) => (
            <div key={card.id} className="flex items-center justify-between">
              <span className="body-sm text-[var(--color-ink-muted)]">{card.name}</span>
              <span className="body-sm tabular-nums">{formatCurrency(card.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
