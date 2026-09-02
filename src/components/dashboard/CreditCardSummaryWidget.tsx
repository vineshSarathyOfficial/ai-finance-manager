import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { CreditUtilizationBar } from "@/components/credit-cards/CreditUtilizationBar";

interface CreditCardSummaryWidgetProps {
  summary: {
    totalSpend: number;
    totalOutstanding?: number;
    cards: Array<{
      id: string;
      name: string;
      amount: number;
      outstanding?: number;
      utilizationPct?: number | null;
      creditLimit?: number | null;
    }>;
    cardCount: number;
  };
}

export function CreditCardSummaryWidget({ summary }: CreditCardSummaryWidgetProps) {
  const hasLimits = summary.cards.some((c) => c.creditLimit != null && c.creditLimit > 0);
  const totalLimit = summary.cards.reduce((s, c) => s + (c.creditLimit ?? 0), 0);
  const totalOutstanding =
    summary.totalOutstanding ?? summary.cards.reduce((s, c) => s + (c.outstanding ?? 0), 0);
  const overallUtil =
    hasLimits && totalLimit > 0
      ? Math.round((totalOutstanding / totalLimit) * 1000) / 10
      : null;

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

      {hasLimits ? (
        <>
          <p className="display-md text-[var(--color-ink)] mb-1 break-words body-tabular">
            {formatCurrency(totalOutstanding)}
            <span className="body-sm text-[var(--color-ink-muted)] font-normal ml-2">outstanding</span>
          </p>
          <CreditUtilizationBar utilizationPct={overallUtil} className="mb-3" />
        </>
      ) : (
        <p className="display-md text-[var(--color-ink)] mb-3 break-words body-tabular">
          {formatCurrency(summary.totalSpend)}
          <span className="body-sm text-[var(--color-ink-muted)] font-normal ml-2">this month</span>
        </p>
      )}

      <div className="space-y-2">
        {summary.cards.slice(0, 3).map((card) => (
          <Link
            key={card.id}
            href={`/credit-cards/${card.id}`}
            className="flex items-center justify-between py-2 border-t border-[var(--color-hairline-soft)] first:border-0"
          >
            <span className="body-sm text-[var(--color-ink)]">{card.name}</span>
            <span className="body-sm font-medium text-[var(--color-ink)] body-tabular">
              {formatCurrency(card.outstanding ?? card.amount)}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
