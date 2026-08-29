import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface CreditCardSummaryWidgetProps {
  summary: {
    totalSpend: number;
    cards: Array<{ id: string; name: string; amount: number }>;
    cardCount: number;
  };
}

export function CreditCardSummaryWidget({ summary }: CreditCardSummaryWidgetProps) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <CreditCard className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
          <h3 className="title-md text-[var(--color-ink)]">Credit Cards</h3>
        </div>
        <Link
          href="/credit-cards"
          className="body-sm text-[var(--color-primary)] hover:text-[var(--color-primary-active)] flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
        >
          Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <p className="display-md text-[var(--color-ink)] mb-3 break-words">
        {formatCurrency(summary.totalSpend)}
        <span className="body-sm text-[var(--color-ink-muted)] font-normal ml-2">this month</span>
      </p>

      <div className="space-y-2">
        {summary.cards.slice(0, 3).map((card) => (
          <Link
            key={card.id}
            href={`/credit-cards?cardId=${card.id}`}
            className="flex items-center justify-between py-2 border-t border-[var(--color-hairline-soft)] first:border-0"
          >
            <span className="body-sm text-[var(--color-ink)]">{card.name}</span>
            <span className="body-sm font-medium text-[var(--color-ink)]">{formatCurrency(card.amount)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
